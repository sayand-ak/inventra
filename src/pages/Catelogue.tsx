import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { addCatalogue as apiAddCatalogue, getCatalogues } from "../api/catalogue";
import { getProducts } from "../api/product";
import type { Product } from "../api/product";
import "../styles/catalogue.css";

interface PricingRule {
  productIds: string[];
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

interface FormState {
  catalogueName: string;
  customerName: string;
  customerType: string;
  place: string;
}

const emptyForm: FormState = {
  catalogueName: "",
  customerName: "",
  customerType: "",
  place: "",
};

const Catalogues = () => {
  const navigate = useNavigate();

  const [catalogues, setCatalogues] = useState<Catalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Product list filters
  const [productSearch, setProductSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");

  // Active group being edited (which rule index is open)
  const [activeRuleIdx, setActiveRuleIdx] = useState<number | null>(null);

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
      const data = await getCatalogues();
      setCatalogues(data);
    } catch {
      setError("Could not load catalogues.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    setProductsLoading(true);
    try {
      const data = await getProducts({ limit: 500, page: 1 });
      setAllProducts(data.products);
    } catch {
      setAllProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }

  function openModal() {
    setForm(emptyForm);
    setRules([]);
    setError("");
    setProductSearch("");
    setFilterCategory("");
    setFilterBrand("");
    setActiveRuleIdx(null);
    setShowModal(true);
    loadProducts();
  }

  function addGroup() {
    const newIdx = rules.length;
    setRules((prev) => [...prev, { productIds: [], increaseAmount: 0 }]);
    setActiveRuleIdx(newIdx);
  }

  function removeGroup(idx: number) {
    setRules((prev) => prev.filter((_, i) => i !== idx));
    setActiveRuleIdx((prev) => {
      if (prev === null) return null;
      if (prev === idx) return null;
      if (prev > idx) return prev - 1;
      return prev;
    });
  }

  function updateIncrease(idx: number, amount: number) {
    setRules((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, increaseAmount: amount } : r))
    );
  }

  // All product IDs already assigned to any group
  const allAssigned = new Set(rules.flatMap((r) => r.productIds));

  function toggleProduct(productId: string) {
    if (activeRuleIdx === null) return;
    setRules((prev) =>
      prev.map((r, i) => {
        if (i !== activeRuleIdx) return r;
        const already = r.productIds.includes(productId);
        return {
          ...r,
          productIds: already
            ? r.productIds.filter((id) => id !== productId)
            : [...r.productIds, productId],
        };
      })
    );
  }

  // Derived filter options
  const categoryOptions = Array.from(
    new Map(allProducts.map((p) => [p.category._id, p.category.name])).entries()
  );
  const brandOptions = Array.from(
    new Map(allProducts.map((p) => [p.brand._id, p.brand.name])).entries()
  );

  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = filterCategory ? p.category._id === filterCategory : true;
    const matchesBrand = filterBrand ? p.brand._id === filterBrand : true;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!rules.length) {
      setError("Add at least one pricing group.");
      return;
    }
    for (const r of rules) {
      if (!r.productIds.length) {
        setError("Each pricing group must have at least one product selected.");
        return;
      }
      if (!r.increaseAmount) {
        setError("Each pricing group must have a price increase amount.");
        return;
      }
    }
    setSubmitting(true);
    setError("");
    try {
      const created = await apiAddCatalogue({ ...form, pricingRules: rules });
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

  const totalSelected = new Set(rules.flatMap((r) => r.productIds)).size;

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
                  <th>Catalogue</th><th>Customer</th><th>Place</th><th>Groups</th><th>Status</th><th>Created</th><th>Actions</th>
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
                  <th>Catalogue</th><th>Customer</th><th>Place</th><th>Groups</th><th>Status</th><th>Created</th><th>Actions</th>
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
                            {cat.pricingRules?.length ?? 0} group{(cat.pricingRules?.length ?? 0) !== 1 ? "s" : ""}
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
          <div className="modal" style={{ maxWidth: 780 }}>
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

                {/* ── Basic Info ── */}
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

                {/* ── Pricing Groups ── */}
                <div className="section-divider">
                  Pricing Groups
                  {totalSelected > 0 && (
                    <span style={{ fontWeight: 400, fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                      {totalSelected} product{totalSelected !== 1 ? "s" : ""} assigned
                    </span>
                  )}
                </div>
                <p className="section-hint">
                  Create groups of products and set a price increase for each group.
                  A product can only belong to one group.
                </p>

                {/* Group tabs */}
                {rules.length > 0 && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {rules.map((rule, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveRuleIdx(activeRuleIdx === idx ? null : idx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "1.5px solid",
                          borderColor: activeRuleIdx === idx ? "var(--accent)" : "var(--border)",
                          background: activeRuleIdx === idx ? "rgba(99,102,241,0.08)" : "var(--surface)",
                          color: activeRuleIdx === idx ? "var(--accent)" : "var(--text-muted)",
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        <span>Group {idx + 1}</span>
                        {rule.productIds.length > 0 && (
                          <span style={{
                            background: activeRuleIdx === idx ? "var(--accent)" : "var(--border)",
                            color: activeRuleIdx === idx ? "#fff" : "var(--text-muted)",
                            borderRadius: 99,
                            fontSize: 11,
                            padding: "1px 7px",
                            fontWeight: 600,
                          }}>
                            {rule.productIds.length}
                          </span>
                        )}
                        {rule.increaseAmount > 0 && (
                          <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>
                            +₹{rule.increaseAmount}
                          </span>
                        )}
                        <span
                          onClick={e => { e.stopPropagation(); removeGroup(idx); }}
                          style={{ marginLeft: 2, opacity: 0.5, lineHeight: 1, cursor: "pointer" }}
                        >
                          ×
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={addGroup}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "6px 12px",
                        borderRadius: 8,
                        border: "1.5px dashed var(--border)",
                        background: "transparent",
                        color: "var(--text-muted)",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      + Add Group
                    </button>
                  </div>
                )}

                {/* No groups yet */}
                {rules.length === 0 && (
                  <button type="button" className="add-rule-btn" onClick={addGroup}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Pricing Group
                  </button>
                )}

                {/* Active group editor */}
                {activeRuleIdx !== null && rules[activeRuleIdx] && (() => {
                  const rule = rules[activeRuleIdx];
                  return (
                    <div className="rule-card is-active" style={{ marginTop: 8 }}>
                      <div className="rule-card-head">
                        <span className="rule-card-label">
                          <span className="rule-index">{activeRuleIdx + 1}</span>
                          Group {activeRuleIdx + 1}
                          {rule.productIds.length > 0 && rule.increaseAmount > 0 && (
                            <span className="rule-configured-badge">
                              {rule.productIds.length} product{rule.productIds.length !== 1 ? "s" : ""} · +₹{rule.increaseAmount}
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="rule-card-body">
                        {/* Price increase */}
                        <div className="form-group" style={{ marginBottom: 14 }}>
                          <label className="form-label" style={{ fontSize: 11 }}>Price increase for this group *</label>
                          <div className="input-prefix" style={{ maxWidth: 180 }}>
                            <span className="prefix-symbol">₹</span>
                            <input
                              className="form-input"
                              type="number"
                              min="0"
                              step="any"
                              placeholder="0"
                              value={rule.increaseAmount || ""}
                              onChange={e => updateIncrease(activeRuleIdx, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        {/* Search + filter bar */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                          <div className="search-wrap" style={{ flex: 1 }}>
                            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                              className="search-input"
                              placeholder="Search products…"
                              value={productSearch}
                              onChange={e => setProductSearch(e.target.value)}
                            />
                          </div>
                          <select
                            className="form-select"
                            style={{ width: 140, fontSize: 12 }}
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                          >
                            <option value="">All categories</option>
                            {categoryOptions.map(([id, name]) => (
                              <option key={id} value={id}>{name}</option>
                            ))}
                          </select>
                          <select
                            className="form-select"
                            style={{ width: 130, fontSize: 12 }}
                            value={filterBrand}
                            onChange={e => setFilterBrand(e.target.value)}
                          >
                            <option value="">All brands</option>
                            {brandOptions.map(([id, name]) => (
                              <option key={id} value={id}>{name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Product list */}
                        {productsLoading ? (
                          <div className="ref-list" style={{ pointerEvents: "none", opacity: 0.5 }}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <div key={n} className="ref-item">
                                <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                  <div className="skeleton" style={{ height: 12, width: `${40 + n * 10}%`, borderRadius: 4, marginBottom: 5 }} />
                                  <div className="skeleton" style={{ height: 10, width: "40%", borderRadius: 4 }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="ref-list">
                            <div className="ref-empty">No products match your search.</div>
                          </div>
                        ) : (
                          <div className="ref-list" style={{ maxHeight: 280 }}>
                            {filteredProducts.map(product => {
                              const isSelected = rule.productIds.includes(product._id);
                              // Taken by a DIFFERENT group
                              const takenByOther = !isSelected && allAssigned.has(product._id);
                              return (
                                <div
                                  key={product._id}
                                  className={`ref-item${isSelected ? " selected" : ""}${takenByOther ? " has-dup" : ""}`}
                                  onClick={() => !takenByOther && toggleProduct(product._id)}
                                  style={{
                                    cursor: takenByOther ? "not-allowed" : "pointer",
                                    opacity: takenByOther ? 0.45 : 1,
                                  }}
                                >
                                  {/* Checkbox */}
                                  <div style={{
                                    width: 15,
                                    height: 15,
                                    borderRadius: 4,
                                    border: "1.5px solid",
                                    borderColor: isSelected ? "var(--accent)" : "var(--border)",
                                    background: isSelected ? "var(--accent)" : "transparent",
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}>
                                    {isSelected && (
                                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="ref-item-name">{product.name}</div>
                                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                      {product.brand.name} · {product.category.name} · {product.quantity.value} {product.quantity.unit}
                                      {takenByOther && (
                                        <span style={{ color: "#f59e0b", marginLeft: 6 }}>in another group</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Stock pill */}
                                  <span style={{
                                    fontSize: 11,
                                    padding: "2px 8px",
                                    borderRadius: 99,
                                    background: product.currentStock > 0 ? "rgba(16,185,129,0.12)" : "rgba(244,63,94,0.1)",
                                    color: product.currentStock > 0 ? "#10b981" : "#f43f5e",
                                    flexShrink: 0,
                                    fontWeight: 500,
                                  }}>
                                    {product.currentStock > 0 ? `${product.currentStock} in stock` : "out of stock"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Selection summary */}
                        {rule.productIds.length > 0 && (
                          <div className="rule-summary complete" style={{ marginTop: 10 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span className="summary-example">
                              {rule.productIds.length} product{rule.productIds.length !== 1 ? "s" : ""} selected
                              {rule.increaseAmount > 0 ? ` → +₹${rule.increaseAmount} each` : " — set a price increase above"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
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