import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { getCategories } from "../api/category";
import { getAllBrands } from "../api/brand";
import { addCatalogue as apiAddCatalogue, getCatalogues } from "../api/catalogue";
import "../styles/catalogue.css";
import { getQuantityValues } from "../api/product";

interface PricingRule {
  ruleType: "CATEGORY" | "BRAND";
  referenceId: string;
  referenceName?: string;
  quantityValue: number;
  quantityUnit: string;
  increaseAmount: number;
}

interface Catalogue {
  _id: string;
  catalogueName: string;
  customerName: string;
  customerType: string;
  place?: string;
  pricingRules: PricingRule[];
  status: "draft" | "generated";
  generatedPdfUrl?: string;
  generatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface RefItem {
  _id: string;
  name: string;
}

const emptyRule = (): PricingRule => ({
  ruleType: "CATEGORY",
  referenceId: "",
  referenceName: "",
  quantityValue: 0,
  quantityUnit: "kg",
  increaseAmount: 0,
});

const emptyForm = { catalogueName: "", customerName: "", customerType: "", place: "" };

function getRuleSummary(
  rule: PricingRule,
  categories: RefItem[],
  brands: RefItem[]
): string | null {
  if (!rule.referenceId || !rule.quantityValue || !rule.increaseAmount) return null;
  const list = rule.ruleType === "CATEGORY" ? categories : brands;
  const match = list.find((x) => x._id === rule.referenceId);
  if (!match) return null;
  const prefix = rule.ruleType === "CATEGORY" ? "All products in" : "All";
  const suffix = rule.ruleType === "BRAND" ? " (brand)" : "";
  return `${prefix} "${match.name}"${suffix} · ${rule.quantityValue} ${rule.quantityUnit} → +₹${rule.increaseAmount}`;
}

function isDuplicateRule(rules: PricingRule[], idx: number): boolean {
  const r = rules[idx];
  if (!r.referenceId) return false;
  return rules.some(
    (other, i) =>
      i !== idx &&
      other.ruleType === r.ruleType &&
      other.referenceId === r.referenceId &&
      other.quantityValue === r.quantityValue &&
      other.quantityUnit === r.quantityUnit
  );
}

const Catalogues = () => {
  const navigate = useNavigate();

  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<RefItem[]>([]);
  const [brands, setBrands] = useState<RefItem[]>([]);
  const [refLoading, setRefLoading] = useState(false);
  const [quantityValues, setQuantityValues] = useState<{ value: number; unit: string }[]>([]);

  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Products", path: "/products" },
    { label: "Brands", path: "/brands" },
    { label: "Categories", path: "/categories" },
    { label: "Catalogues", path: "/catalogues", active: true },
  ];

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [catalogues, qtyValues] = await Promise.all([
        getCatalogues(),
        getQuantityValues(),
      ]);
      setCatalogues(catalogues);
      setQuantityValues(qtyValues);
    } catch {
      setError("Could not load catalogues.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRefs() {
    setRefLoading(true);
    try {
      const [cats, brnds] = await Promise.allSettled([
        getCategories(),
        getAllBrands(),
      ]);
      if (cats.status === "fulfilled")
        setCategories(
          Array.isArray(cats.value)
            ? cats.value.map((c) => ({ _id: String(c._id), name: c.name }))
            : []
        );
      if (brnds.status === "fulfilled")
        setBrands(Array.isArray(brnds.value) ? brnds.value : []);
    } finally {
      setRefLoading(false);
    }
  }

  function openModal() {
    setForm(emptyForm);
    setRules([]);
    setError("");
    setShowModal(true);
    loadRefs();
  }

  function addRule() {
    setRules((prev) => [...prev, emptyRule()]);
  }

  function updateRule(idx: number, patch: Partial<PricingRule>) {
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const updated = { ...r, ...patch };
        if (patch.ruleType && patch.ruleType !== r.ruleType)
          updated.referenceId = "";
        return updated;
      })
    );
  }

  function removeRule(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    const hasDup = rules.some((_, i) => isDuplicateRule(rules, i));
    if (hasDup) {
      setError("Please fix duplicate pricing rules before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const cleanRules = rules.map(({ referenceName, ...rest }) => {
        void referenceName;
        return rest;
      });
      const created = await apiAddCatalogue({
        ...form,
        pricingRules: cleanRules,
      });
      setCatalogues((prev) => [created, ...prev]);
      setShowModal(false);
    } catch {
      setError("Failed to create catalogue. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      // wire up your delete API call here when ready
      setCatalogues((prev) => prev.filter((c) => c._id !== id));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete catalogue.");
    }
  }

  const filtered = catalogues.filter(
    (c) =>
      c.catalogueName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerType.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <div className="cat-root">
        <Sidebar navItems={navItems} />
        <main className="cat-main">

          <div className="cat-topbar">
            <div>
              <p className="cat-eyebrow">Manage &amp; generate</p>
              <h1 className="cat-title">Product <span>Catalogues</span></h1>
            </div>
            <div className="cat-actions">
              <div className="search-wrap">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="search-input"
                  placeholder="Search catalogues…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <button className="add-btn" onClick={openModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Catalogue
              </button>
            </div>
          </div>

          <div className="summary-row">
            {[
              { label: "Total", value: catalogues.length, color: "#3b82f6" },
              { label: "Draft", value: catalogues.filter(c => c.status === "draft").length, color: "#f59e0b" },
              { label: "Generated", value: catalogues.filter(c => c.status === "generated").length, color: "#10b981" },
            ].map(p => (
              <div className="summary-pill" key={p.label}>
                <div className="pill-dot" style={{ background: p.color }} />
                <span className="pill-label">{p.label}</span>
                <span className="pill-val">{p.value}</span>
              </div>
            ))}
          </div>

          <div className="table-card">
            <div className="table-header-row">
              <span className="table-section-title">All Catalogues</span>
              <span className="table-count">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {loading ? (
              <table className="data-table">
                <thead><tr>
                  <th>Catalogue</th><th>Customer</th><th>Place</th><th>Rules</th><th>Status</th><th>Created</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {[1, 2, 3].map(i => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5, 6, 7].map(j => (
                        <td key={j}><div className="skeleton" style={{ height: 14, width: j === 1 ? "80%" : "60%" }} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="empty-title">{search ? "No results found" : "No catalogues yet"}</div>
                <div className="empty-sub">{search ? "Try a different search term." : "Create your first catalogue to get started."}</div>
                {!search && (
                  <button className="empty-cta" onClick={openModal}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Create Catalogue
                  </button>
                )}
              </div>
            ) : (
              <table className="data-table">
                <thead><tr>
                  <th>Catalogue</th><th>Customer</th><th>Place</th><th>Rules</th><th>Status</th><th>Created</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map((cat, i) => {
                    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#a78bfa", "#f43f5e"];
                    const bgs = ["rgba(59,130,246,0.15)", "rgba(16,185,129,0.15)", "rgba(245,158,11,0.15)", "rgba(167,139,250,0.15)", "rgba(244,63,94,0.15)"];
                    const ci = i % 5;
                    return (
                      <tr key={cat._id}>
                        <td>
                          <div className="cat-name">{cat.catalogueName}</div>
                          <div className="cat-sub">{cat.customerType}</div>
                        </td>
                        <td>
                          <div className="cust-cell">
                            <div className="cust-av" style={{ background: bgs[ci], color: colors[ci] }}>
                              {cat.customerName[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 13 }}>{cat.customerName}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{cat.place || "—"}</td>
                        <td>
                          <span className="rules-badge">
                            {cat.pricingRules?.length ?? 0} rule{(cat.pricingRules?.length ?? 0) !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${cat.status === "draft" ? "status-draft" : "status-generated"}`}>
                            <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor"><circle cx="3" cy="3" r="3" /></svg>
                            {cat.status}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
                          {formatDate(cat.createdAt)}
                        </td>
                        <td>
                          <div className="action-cell">
                            {cat.status === "draft" ? (
                              <button className="tbl-btn btn-create" onClick={() => navigate(`/catalogues/${cat._id}/generate`)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                  <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                                </svg>
                                Generate
                              </button>
                            ) : (
                              <a href={cat.generatedPdfUrl} target="_blank" rel="noopener noreferrer" className="tbl-btn btn-download">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download
                              </a>
                            )}
                            <button className="tbl-btn btn-delete" onClick={() => setDeleteTarget(cat._id)} title="Delete">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </main>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">New Catalogue</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAdd} style={{ display: "contents" }}>
              <div className="modal-scroll">
                {error && <div className="modal-error">{error}</div>}

                <div className="section-divider">Basic Info</div>

                <div className="form-group">
                  <label className="form-label">Catalogue Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Q3 Wholesale — Kochi"
                    value={form.catalogueName}
                    onChange={e => setForm({ ...form, catalogueName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Customer Name *</label>
                    <input
                      className="form-input"
                      placeholder="Rajesh Kumar"
                      value={form.customerName}
                      onChange={e => setForm({ ...form, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Type *</label>
                    <input
                      className="form-input"
                      placeholder="Retailer / Wholesaler"
                      value={form.customerType}
                      onChange={e => setForm({ ...form, customerType: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Place</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Kochi, Kerala"
                    value={form.place}
                    onChange={e => setForm({ ...form, place: e.target.value })}
                  />
                </div>

                <div className="section-divider">Pricing Rules</div>
                <p className="section-hint">
                  Each rule matches products by <code>category or brand</code> + <code>exact quantity</code> and applies the same wholesale price increase to all matches.
                  Example: all <code>Whey Protein · 2 kg</code> → <code>+₹500</code>
                </p>

                <div className="rules-list">
                  {rules.map((rule, idx) => {
                    const refList = rule.ruleType === "CATEGORY" ? categories : brands;
                    const label = rule.ruleType === "CATEGORY" ? "category" : "brand";
                    const summary = getRuleSummary(rule, categories, brands);
                    const isDup = isDuplicateRule(rules, idx);
                    const isComplete = !!summary && !isDup;

                    return (
                      <div
                        key={idx}
                        className={`rule-card${isDup ? " has-dup" : isComplete ? " is-complete" : ""}`}
                      >
                        <div className="rule-card-head">
                          <span className="rule-card-label">
                            <span className="rule-index">{idx + 1}</span>
                            Pricing Rule
                            {isComplete && <span className="rule-configured-badge">configured</span>}
                            {isDup && <span className="rule-dup-badge">duplicate</span>}
                          </span>
                          <button type="button" className="rule-remove" onClick={() => removeRule(idx)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>

                        <div className="rule-card-body">
                          <div>
                            <div className="match-label">Match products by</div>
                            <div className="rule-type-selector">
                              {(["CATEGORY", "BRAND"] as const).map(type => (
                                <button
                                  key={type}
                                  type="button"
                                  className={`type-option${rule.ruleType === type ? " active" : ""}`}
                                  onClick={() => updateRule(idx, { ruleType: type })}
                                >
                                  <div className="type-icon">
                                    {type === "CATEGORY" ? (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                      </svg>
                                    ) : (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32" />
                                      </svg>
                                    )}
                                  </div>
                                  {type === "CATEGORY" ? "Category" : "Brand"}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">
                              Select {label} *{" "}
                              {refLoading && (
                                <span style={{ fontWeight: 400, fontStyle: "italic", color: "var(--text-muted)" }}>
                                  loading…
                                </span>
                              )}
                            </label>

                            {refLoading ? (
                              <div className="ref-list" style={{ pointerEvents: "none", opacity: 0.5 }}>
                                {[1, 2, 3].map(n => (
                                  <div key={n} className="ref-item">
                                    <div className="skeleton" style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0 }} />
                                    <div className="skeleton" style={{ height: 12, width: `${50 + n * 15}%`, borderRadius: 4 }} />
                                  </div>
                                ))}
                              </div>
                            ) : refList.length === 0 ? (
                              <div className="ref-list">
                                <div className="ref-empty">No {label}s found. Add some first.</div>
                              </div>
                            ) : (
                              <div className="ref-list">
                                {refList.map(item => (
                                  <div
                                    key={item._id}
                                    className={`ref-item${rule.referenceId === item._id ? " selected" : ""}`}
                                    onClick={() => updateRule(idx, { referenceId: item._id })}
                                  >
                                    <div className="ref-dot" />
                                    <span className="ref-item-name">{item.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="qty-label">When quantity is exactly</div>
                            <div className="qty-row">
                              <div className="form-group" style={{ marginBottom: 0, flex: 2 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Quantity *</label>
                                {quantityValues.length === 0 ? (
                                  <select className="form-select" disabled>
                                    <option>No quantities found</option>
                                  </select>
                                ) : (
                                  <select
                                    className="form-select"
                                    value={rule.quantityValue && rule.quantityUnit ? `${rule.quantityValue}::${rule.quantityUnit}` : ""}
                                    onChange={e => {
                                      const [val, unit] = e.target.value.split("::");
                                      updateRule(idx, {
                                        quantityValue: parseFloat(val),
                                        quantityUnit: unit,
                                      });
                                    }}
                                    required
                                  >
                                    <option value="" disabled>Select quantity…</option>
                                    {quantityValues.map(q => (
                                      <option key={`${q.value}::${q.unit}`} value={`${q.value}::${q.unit}`}>
                                        {q.value} {q.unit}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                              <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                <label className="form-label" style={{ fontSize: 11 }}>Price increase *</label>
                                <div className="input-prefix">
                                  <span className="prefix-symbol">₹</span>
                                  <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    value={rule.increaseAmount || ""}
                                    onChange={e => updateRule(idx, { increaseAmount: parseFloat(e.target.value) || 0 })}
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {isDup ? (
                            <div className="rule-summary duplicate">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              <span>
                                Duplicate rule — another rule already targets the same {label}, quantity, and unit.
                                Each combination must be unique.
                              </span>
                            </div>
                          ) : summary ? (
                            <div className="rule-summary complete">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span className="summary-example">{summary}</span>
                            </div>
                          ) : (
                            <div className="rule-summary incomplete">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                              <span>Fill in all fields above to preview this rule.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="button" className="add-rule-btn" onClick={addRule}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Pricing Rule
                </button>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      Creating…
                    </>
                  ) : "Create Catalogue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <div className="confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <div className="confirm-title">Delete catalogue?</div>
            <div className="confirm-sub">This action cannot be undone.</div>
            <div className="confirm-btns">
              <button className="btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(deleteTarget)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Catalogues;