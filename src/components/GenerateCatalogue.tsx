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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

function CoverPage({
  customerName,
  place,
  generatedDate,
}: {
  customerName: string;
  place?: string;
  generatedDate: string;
}) {
  return (
    <div className="cp-page cp-cover">
      {/* Top accent bar */}
      <div className="cp-cover-accent" />

      <div className="cp-cover-body">
        {/* Logo area */}
        <div className="cp-logo-box">
          <div className="cp-logo-placeholder">
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect width="38" height="38" rx="8" fill="#1a1a2e" />
              <text x="19" y="25" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700" fontFamily="sans-serif">AM</text>
            </svg>
            <span className="cp-logo-text">AM Dynamic Wellness</span>
          </div>
        </div>

        {/* Main title block */}
        <div className="cp-title-block">
          <div className="cp-title-eyebrow">WHOLESALE</div>
          <div className="cp-title-main">PRODUCT<br />CATALOGUE</div>
          <div className="cp-title-rule" />
        </div>

        {/* Customer info */}
        <div className="cp-customer-block">
          <div className="cp-customer-label">Prepared for</div>
          <div className="cp-customer-name">{customerName}</div>
          {place && <div className="cp-customer-place">{place}</div>}
        </div>
      </div>

      {/* Footer */}
      <div className="cp-cover-footer">
        <span>Generated: {generatedDate}</span>
        <span>AM Dynamic Wellness</span>
      </div>
    </div>
  );
}

// ─── Index Page ───────────────────────────────────────────────────────────────

function IndexPage({ grouped }: { grouped: Record<string, LineItem[]> }) {
  return (
    <div className="cp-page cp-index">
      <div className="cp-index-header">
        <div className="cp-index-title">INDEX</div>
        <div className="cp-index-rule" />
      </div>

      <div className="cp-index-body">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="cp-index-category">
            <div className="cp-index-cat-name">{category.toUpperCase()}</div>
            <ul className="cp-index-list">
              {items.map((item) => (
                <li key={String(item.productId)} className="cp-index-item">
                  <span className="cp-index-bullet">•</span>
                  <span>{item.productName}</span>
                  <span className="cp-index-qty">
                    {item.quantity.value} {item.quantity.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="cp-page-footer">
        <span>AM Dynamic Wellness</span>
        <span>Page 2</span>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ item }: { item: LineItem }) {
  return (
    <div className="cp-product-card">
      {/* Image area */}
      <div className="cp-product-img-wrap">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName}
            className="cp-product-img"
          />
        ) : (
          <div className="cp-product-img-placeholder">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Product Image</span>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="cp-product-info">
        <div className="cp-product-name">{item.productName}</div>

        <div className="cp-product-meta">
          <div className="cp-meta-row">
            <span className="cp-meta-label">Brand</span>
            <span className="cp-meta-value">{item.brand}</span>
          </div>
          <div className="cp-meta-row">
            <span className="cp-meta-label">Quantity</span>
            <span className="cp-meta-value">
              {item.quantity.value} {item.quantity.unit}
            </span>
          </div>
          {item.flavour && item.flavour !== "none" && (
            <div className="cp-meta-row">
              <span className="cp-meta-label">Flavour</span>
              <span className="cp-meta-value">{item.flavour}</span>
            </div>
          )}
        </div>

        <div className="cp-product-pricing">
          <div className="cp-price-row cp-price-retail">
            <span className="cp-price-label">Retail Price</span>
            <span className="cp-price-val cp-price-val--retail">
              {item.baseRetailPrice > 0
                ? `₹${item.baseRetailPrice.toLocaleString("en-IN")}`
                : "—"}
            </span>
          </div>
          <div className="cp-price-row cp-price-wholesale">
            <span className="cp-price-label">Wholesale Price</span>
            <span className="cp-price-val cp-price-val--wholesale">
              ₹{item.cataloguePrice.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Page (2 cards) ───────────────────────────────────────────────────

function ProductPage({
  items,
  pageNum,
}: {
  items: LineItem[];
  pageNum: number;
}) {
  return (
    <div className="cp-page cp-product-page">
      <div className="cp-product-page-inner">
        {items.map((item) => (
          <ProductCard key={String(item.productId)} item={item} />
        ))}
        {/* Fill empty slot if only 1 product on last page */}
        {items.length === 1 && <div className="cp-product-card cp-product-card--empty" />}
      </div>

      <div className="cp-page-footer">
        <span>Page {pageNum}</span>
        <span>AM Dynamic Wellness</span>
      </div>
    </div>
  );
}

// ─── Full Catalogue Template ──────────────────────────────────────────────────

function CatalogueTemplate({ data }: { data: GenerateResponse }) {
  const { catalogue, grouped } = data;

  const generatedDate = new Date(catalogue.generatedAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Flatten all products in category order
  const allItems: LineItem[] = Object.values(grouped).flat();
  const pages = chunk(allItems, 2);

  return (
    <div className="cp-root">
      {/* Page 1 — Cover */}
      <CoverPage
        customerName={catalogue.customerName}
        place={catalogue.place}
        generatedDate={generatedDate}
      />

      {/* Page 2 — Index */}
      <IndexPage grouped={grouped} />

      {/* Pages 3+ — Products */}
      {pages.map((pageItems, i) => (
        <ProductPage key={i} items={pageItems} pageNum={i + 3} />
      ))}
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

  const activeNavItems = navItems.map((n) =>
    n.path === "/catalogues" ? { ...n, active: true } : n
  );

  useEffect(() => {
    if (!id) return;
    generateCatalogue(id)
      .then(setData)
      .catch(() =>
        setError(
          "Failed to generate catalogue. Please check that products exist for the configured rules."
        )
      )
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
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="gc-error-title">Generation failed</div>
            <div className="gc-error-sub">{error}</div>
            <button className="btn-cancel" onClick={() => navigate("/catalogues")}>
              ← Back to Catalogues
            </button>
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
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
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

          {/* ── Summary ── */}
          <div className="gc-section">
            <div className="gc-section-label">Summary</div>
            <div className="summary-row" style={{ marginBottom: 0 }}>
              {[
                { label: "Customer", value: catalogue.customerName, color: "#3b82f6" },
                { label: "Type", value: catalogue.customerType, color: "#a78bfa" },
                { label: "Categories", value: Object.keys(grouped).length, color: "#f59e0b" },
                { label: "Products", value: lineItems.length, color: "#10b981" },
              ].map((p) => (
                <div className="summary-pill" key={p.label}>
                  <div className="pill-dot" style={{ background: p.color }} />
                  <span className="pill-label">{p.label}</span>
                  <span className="pill-val">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Catalogue Preview ── */}
          <div className="gc-section">
            <div className="gc-section-label">Catalogue Preview</div>
            <div className="gc-preview-card">
              <div className="gc-preview-bar">
                <div className="gc-dot gc-dot-red" />
                <div className="gc-dot gc-dot-yellow" />
                <div className="gc-dot gc-dot-green" />
                <span className="gc-preview-label">Print preview · scroll to browse pages</span>
              </div>
              <div className="gc-preview-body">
                <div className="gc-preview-scaler">
                  <CatalogueTemplate data={data} />
                </div>
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
          @page { size: A4; margin: 0; }
        }
        @media screen { .print-only { display: none; } }
      `}</style>
    </>
  );
};

export default GenerateCatalogue;