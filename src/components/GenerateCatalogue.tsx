import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  generateCatalogue,
  type GenerateResponse,
  type LineItem,
} from "../api/catalogue";
import "../styles/catalogueGenerate.css";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Products", path: "/products" },
  { label: "Brands", path: "/brands" },
  { label: "Categories", path: "/categories" },
  { label: "Catalogues", path: "/catalogues" },
];

// ─── Print Template (unchanged) ──────────────────────────────────────────────

function CatalogueTemplate({ data }: { data: GenerateResponse }) {
  const { catalogue, grouped } = data;
  const totalProducts = Object.values(grouped).reduce((s, items) => s + items.length, 0);
  const generatedDate = new Date(catalogue.generatedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const categoryColors = ["#3b82f6", "#10b981", "#f59e0b", "#a78bfa", "#f43f5e"];

  return (
    <div id="catalogue-print-root" style={{
      fontFamily: "'Outfit', 'Inter', Arial, sans-serif",
      fontSize: 12, color: "#111827", background: "#fff",
      padding: "36px 40px", boxSizing: "border-box", minWidth: 700,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>AM Dynamic Wellness</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, letterSpacing: "0.3px" }}>WHOLESALE PRICE CATALOGUE</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{catalogue.catalogueName}</div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>Generated: {generatedDate}</div>
        </div>
      </div>

      <div style={{ height: 2, background: "linear-gradient(90deg, #3b82f6, #a78bfa)", borderRadius: 2, marginBottom: 20 }} />

      <div style={{ display: "flex", gap: 0, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 28, overflow: "hidden" }}>
        {[
          { label: "Prepared For", value: catalogue.customerName },
          { label: "Customer Type", value: catalogue.customerType },
          ...(catalogue.place ? [{ label: "Location", value: catalogue.place }] : []),
          { label: "Total Products", value: String(totalProducts) },
        ].map((f, i, arr) => (
          <div key={f.label} style={{ flex: 1, padding: "14px 18px", borderRight: i < arr.length - 1 ? "1px solid #e5e7eb" : "none" }}>
            <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{f.value}</div>
          </div>
        ))}
      </div>

      {Object.entries(grouped).map(([category, items], catIdx) => {
        const accentColor = categoryColors[catIdx % categoryColors.length];
        return (
          <div key={category} style={{ marginBottom: 32, pageBreakInside: "avoid" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 3, height: 18, background: accentColor, borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.8px" }}>{category}</span>
              <span style={{ fontSize: 10, color: accentColor, fontWeight: 600, background: `${accentColor}18`, padding: "2px 8px", borderRadius: 20 }}>
                {items.length} product{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  {["Product", "Brand", "Flavour", "Pack Size", "MRP (₹)", "Your Price (₹)"].map((h, i) => (
                    <th key={h} style={{
                      padding: "8px 12px",
                      textAlign: i >= 4 ? "right" : i === 3 ? "center" : "left",
                      fontWeight: 600, fontSize: 10.5, color: "#374151",
                      borderBottom: `2px solid ${accentColor}`, whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item: LineItem, i: number) => (
                  <tr key={String(item.productId)} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", fontWeight: 500, color: "#111827" }}>{item.productName}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", color: "#4b5563" }}>{item.brand}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>{item.flavour === "none" ? "—" : item.flavour}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", textAlign: "center", color: "#4b5563" }}>{item.quantity.value} {item.quantity.unit}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#9ca3af", textDecoration: "line-through" }}>
                      {item.baseRetailPrice > 0 ? item.baseRetailPrice.toLocaleString("en-IN") : "—"}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", textAlign: "right" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#111827" }}>{item.cataloguePrice.toLocaleString("en-IN")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <div style={{ marginTop: 24, paddingTop: 14, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
        <span>All prices are in Indian Rupees (₹) · Valid for this order only · Taxes applicable as per norms</span>
        <span>AM Dynamic Wellness Wholesale · {generatedDate}</span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const GenerateCatalogue = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeNavItems = navItems.map(n =>
    n.path === "/catalogues" ? { ...n, active: true } : n
  );

  useEffect(() => {
    if (!id) return;
    generateCatalogue(id)
      .then(setData)
      .catch(() => setError("Failed to generate catalogue. Please check that products exist for the configured rules."))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="cat-root">
        <Sidebar navItems={activeNavItems} />
        <main className="cat-main gc-center">
          <div className="gc-spinner-wrap">
            <svg className="gc-spinner" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <div className="gc-spinner-title">Building catalogue…</div>
            <div className="gc-spinner-sub">Matching products to pricing rules</div>
          </div>
        </main>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="cat-root">
        <Sidebar navItems={activeNavItems} />
        <main className="cat-main gc-center">
          <div className="gc-error-wrap">
            <div className="gc-error-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="gc-error-title">Generation failed</div>
            <div className="gc-error-sub">{error}</div>
            <button className="btn-cancel" onClick={() => navigate("/catalogues")}>← Back to Catalogues</button>
          </div>
        </main>
      </div>
    );
  }

  const { catalogue, grouped, lineItems } = data;

  // ── Success ──
  return (
    <>
      <div className="cat-root no-print">
        <Sidebar navItems={activeNavItems} />
        <main className="cat-main">

          {/* Topbar */}
          <div className="cat-topbar">
            <div>
              <p className="cat-eyebrow">
                <button className="gc-back-btn" onClick={() => navigate("/catalogues")}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                  </svg>
                  Catalogues
                </button>
              </p>
              <h1 className="cat-title">{catalogue.catalogueName}</h1>
            </div>
            <div className="cat-actions">
              <button className="add-btn" onClick={() => window.print()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* ── Section 1: Catalogue Information ── */}
          <div className="gc-section">
            <div className="gc-section-label">
              <span className="gc-section-num">1</span>
              Catalogue Information
            </div>
            <div className="gc-info-grid">
              {[
                { label: "Catalogue Name", value: catalogue.catalogueName },
                { label: "Customer Name", value: catalogue.customerName },
                { label: "Customer Type", value: catalogue.customerType },
                { label: "Location", value: catalogue.place || "—" },
              ].map(f => (
                <div key={f.label} className="gc-info-field">
                  <span className="gc-info-label">{f.label}</span>
                  <span className="gc-info-value">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 2 & 3: Pricing Rules ── */}
          <div className="gc-section">
            <div className="gc-section-label">
              <span className="gc-section-num">2</span>
              Pricing Rules
              <span className="gc-section-badge">{catalogue.pricingRules?.length ?? lineItems.length} rules applied</span>
            </div>
            <div className="gc-rules-list">
              {/* Group line items back into rules for display */}
              {Object.entries(grouped).map(([category, items]) =>
                items.map((item) => (
                  <div key={String(item.productId)} className="gc-rule-chip">
                    <div className="gc-rule-chip-left">
                      <div className="gc-rule-chip-dot" />
                      <span className="gc-rule-chip-name">{item.productName}</span>
                      <span className="gc-rule-chip-cat">{category}</span>
                    </div>
                    <div className="gc-rule-chip-right">
                      <span className="gc-rule-chip-qty">{item.quantity.value} {item.quantity.unit}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Section 3: Stats ── */}
          <div className="gc-section">
            <div className="gc-section-label">
              <span className="gc-section-num">3</span>
              Summary
            </div>
            <div className="summary-row" style={{ marginBottom: 0 }}>
              {[
                { label: "Customer", value: catalogue.customerName, color: "#3b82f6" },
                { label: "Type", value: catalogue.customerType, color: "#a78bfa" },
                { label: "Categories", value: Object.keys(grouped).length, color: "#f59e0b" },
                { label: "Products", value: lineItems.length, color: "#10b981" },
              ].map(p => (
                <div className="summary-pill" key={p.label}>
                  <div className="pill-dot" style={{ background: p.color }} />
                  <span className="pill-label">{p.label}</span>
                  <span className="pill-val">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Section 4: Catalogue Preview ── */}
          <div className="gc-section">
            <div className="gc-section-label">
              <span className="gc-section-num">4</span>
              Catalogue Preview
              <span className="gc-section-hint">What will be printed</span>
            </div>
            <div className="gc-preview-card">
              <div className="gc-preview-bar">
                <div className="gc-dot gc-dot-red" />
                <div className="gc-dot gc-dot-yellow" />
                <div className="gc-dot gc-dot-green" />
                <span className="gc-preview-label">Live Preview</span>
              </div>
              <div className="gc-preview-body">
                <CatalogueTemplate data={data} />
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="gc-actions-bar">
            <button className="btn-cancel" onClick={() => navigate("/catalogues")}>
              ← Back
            </button>
            <button className="add-btn" onClick={() => window.print()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print / Save PDF
            </button>
          </div>

        </main>
      </div>

      {/* Print only */}
      <div className="print-only">
        <CatalogueTemplate data={data} />
      </div>

      <style>{`
        @keyframes cat-spin { to { transform: rotate(360deg); } }
        @media print {
          .no-print  { display: none !important; }
          .print-only { display: block !important; }
          @page { size: A4; margin: 15mm 12mm; }
        }
        @media screen { .print-only { display: none; } }
      `}</style>
    </>
  );
};

export default GenerateCatalogue;