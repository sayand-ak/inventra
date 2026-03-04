import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  type CreateProductDTO,
  type UpdateProductDTO,
} from "../api/product";
import { getAllBrands, type Brand } from "../api/brand";
import { getCategories } from "../api/category";
import "../styles/product.css"

/* ─── Types ─────────────────────────────────────────────── */
interface Product {
  _id: string;
  name: string;
  brand: { _id: string; name: string } | null;
  category: { _id: string; name: string } | null;
  price?: number;
  retailPrice?: number;
  quantity?: { value: number; unit: string };
  count: number;
  openingStock: number;
  currentStock: number;
  description?: string;
  createdAt?: string;
}

interface Category {
  _id: number;
  name: string;
  description?: string;
}

const UNITS = ["kg", "g", "mg", "litre", "ml", "tablet", "box", "bottle", "piece"] as const;

const emptyForm = {
  name: "",
  brandId: "",
  categoryId: "",
  price: "",
  retailPrice: "",
  quantityValue: "",
  quantityUnit: "piece",
  count: "",
  openingStock: "",
  description: "",
};

/* ─── Helpers ────────────────────────────────────────────── */
const stockColor = (current: number, opening: number) => {
  const pct = opening > 0 ? (current / opening) * 100 : 100;
  if (pct <= 20) return { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Critical" };
  if (pct <= 50) return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Low" };
  return { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "OK" };
};

/* ─── Component ──────────────────────────────────────────── */
export default function Products() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = !!user.isAdmin;

  // data
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // ui state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | "view" | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Debounce search ─── */
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setSearchDebounced(search), 400);
  }, [search]);  

  /* ─── Load brands + categories once ─── */
  useEffect(() => {
    Promise.allSettled([getAllBrands(), getCategories()]).then(([b, c]) => {
      if (b.status === "fulfilled") setBrands(b.value);
      if (c.status === "fulfilled") setCategories(c.value);
    });
  }, []);

  /* ─── Load products ─── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (searchDebounced.trim()) {
        const res = await searchProducts(searchDebounced.trim());
        const arr = Array.isArray(res) ? res : res.products ?? [];
        setProducts(arr);
        setTotal(arr.length);
        setPages(1);
      } else {
        const res = await getProducts({
          page,
          limit: 10,
          brandId: filterBrand || undefined,
          categoryId: filterCategory || undefined,
        });
        const arr = Array.isArray(res) ? res : res.products ?? [];
        setProducts(arr);
        setTotal(Array.isArray(res) ? arr.length : res.total ?? arr.length);
        setPages(Array.isArray(res) ? 1 : res.pages ?? 1);
      }
    } catch {
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, filterBrand, filterCategory]);

  useEffect(() => { load(); }, [load]);

  /* ─── Toast ─── */
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ─── Open modals ─── */
  const openCreate = () => {
    setForm({ ...emptyForm });
    setFormError("");
    setModal("create");
  };

  const openEdit = (p: Product) => {
    setSelected(p);
    setForm({
      name: p.name,
      brandId: p.brand?._id ?? "",
      categoryId: p.category?._id ?? "",
      price: p.price != null ? String(p.price) : "",
      retailPrice: p.retailPrice != null ? String(p.retailPrice) : "",
      quantityValue: p.quantity?.value != null ? String(p.quantity.value) : "",
      quantityUnit: p.quantity?.unit ?? "piece",
      count: String(p.count ?? ""),
      openingStock: String(p.openingStock ?? ""),
      description: p.description ?? "",
    });
    setFormError("");
    setModal("edit");
  };

  const openDelete = (p: Product) => { setSelected(p); setModal("delete"); };
  const openView = (p: Product) => { setSelected(p); setModal("view"); };
  const closeModal = () => { setModal(null); setSelected(null); };

  /* ─── Submit create ─── */
  const handleCreate = async () => {
    if (!form.name || !form.brandId || !form.categoryId || !form.count || !form.openingStock) {
      setFormError("Name, brand, category, count and opening stock are required.");
      return;
    }
    if (isAdmin && !form.price) { setFormError("Admin must set a price."); return; }
    setSubmitting(true);
    try {
      const dto: CreateProductDTO = {
        name: form.name,
        brandId: form.brandId,
        categoryId: form.categoryId,
        count: Number(form.count),
        openingStock: Number(form.openingStock),
        description: form.description || undefined,
        ...(form.price ? { price: Number(form.price) } : {}),
        ...(form.retailPrice ? { retailPrice: Number(form.retailPrice) } : {}),
        ...(form.quantityValue
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? { quantity: { value: Number(form.quantityValue), unit: form.quantityUnit } as any }
          : {}),
      };
      await createProduct(dto);
      showToast("Product created successfully", "success");
      closeModal();
      load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setFormError(e?.response?.data?.message || e.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Submit edit ─── */
  const handleEdit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const dto: UpdateProductDTO = {
        name: form.name || undefined,
        brandId: form.brandId || undefined,
        categoryId: form.categoryId || undefined,
        count: form.count ? Number(form.count) : undefined,
        openingStock: form.openingStock ? Number(form.openingStock) : undefined,
        description: form.description || undefined,
        ...(form.price ? { price: Number(form.price) } : {}),
        ...(form.retailPrice ? { retailPrice: Number(form.retailPrice) } : {}),
      };
      await updateProduct(selected._id, dto);
      showToast("Product updated", "success");
      closeModal();
      load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setFormError(e?.response?.data?.message || e.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Submit delete ─── */
  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await deleteProduct(selected._id);
      showToast("Product deleted", "success");
      closeModal();
      load();
    } catch {
      showToast("Failed to delete product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const f = (v: any) => (form as any)[v];
  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  /* ─── Nav items ─── */
  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Products", path: "/products", active: true },
    { label: "Brands", path: "/brands" },
    { label: "Categories", path: "/categories" },
  ];

  const navIcon = (label: string) => {
    if (label === "Dashboard") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>;
    if (label === "Products") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
    if (label === "Brands") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"/></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
  };

  // ✅ FIX: Inlined as a JSX variable so React never unmounts/remounts the inputs
  // on re-render, preserving focus on every keystroke.
  const formFields = (
    <div className="form-grid">
      <div className="form-group full">
        <label className="flabel">Product Name *</label>
        <input className="finput" placeholder="e.g. Paracetamol 500mg" value={f("name")} onChange={e => setF("name", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="flabel">Brand *</label>
        <select className="finput" value={f("brandId")} onChange={e => setF("brandId", e.target.value)}>
          <option value="">Select brand</option>
          {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="flabel">Category *</label>
        <select className="finput" value={f("categoryId")} onChange={e => setF("categoryId", e.target.value)}>
          <option value="">Select category</option>
          {categories.map(c => <option key={c._id} value={String(c._id)}>{c.name}</option>)}
        </select>
      </div>

      {isAdmin && (
        <div className="form-group">
          <label className="flabel">Price (₹) *</label>
          <input className="finput" type="number" min="0" placeholder="0.00" value={f("price")} onChange={e => setF("price", e.target.value)} />
        </div>
      )}

      <div className="form-group">
        <label className="flabel">Retail Price (₹)</label>
        <input className="finput" type="number" min="0" placeholder="0.00" value={f("retailPrice")} onChange={e => setF("retailPrice", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="flabel">Quantity Value</label>
        <input className="finput" type="number" min="0" placeholder="e.g. 500" value={f("quantityValue")} onChange={e => setF("quantityValue", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="flabel">Quantity Unit</label>
        <select className="finput" value={f("quantityUnit")} onChange={e => setF("quantityUnit", e.target.value)}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="flabel">Count *</label>
        <input className="finput" type="number" min="0" placeholder="e.g. 100" value={f("count")} onChange={e => setF("count", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="flabel">Opening Stock *</label>
        <input className="finput" type="number" min="0" placeholder="e.g. 200" value={f("openingStock")} onChange={e => setF("openingStock", e.target.value)} />
      </div>

      <div className="form-group full">
        <label className="flabel">Description</label>
        <textarea className="finput ftextarea" rows={3} placeholder="Optional description..." value={f("description")} onChange={e => setF("description", e.target.value)} />
      </div>
    </div>
  );

  return (
    <>
      <div className="pr-root">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sb-logo">
            <div className="sb-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span className="sb-logo-name">Inventra</span>
          </div>
          <span className="sb-sec">Menu</span>
          {navItems.map(item => (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <button key={item.label} className={`nav-item ${(item as any).active ? "active" : ""}`} onClick={() => navigate(item.path)}>
              {navIcon(item.label)}{item.label}
            </button>
          ))}
          <div className="sb-bottom">
            <div className="user-info">
              <div className="user-av">{(user.email || "U")[0].toUpperCase()}</div>
              <div className="user-det">
                <div className="user-name">{user.email || "User"}</div>
                <div className="user-role">{isAdmin ? "Administrator" : "Shop Keeper"}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={() => { localStorage.clear(); navigate("/login"); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          {/* Header */}
          <div className="ph">
            <div className="ph-left">
              <h1>Product <span>Catalog</span></h1>
              <p>{loading ? "Loading…" : `${total} product${total !== 1 ? "s" : ""} found`}</p>
            </div>
            <button className="add-btn" onClick={openCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Product
            </button>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="search-input" placeholder="Search products…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <select className="filter-select" value={filterBrand} onChange={e => { setFilterBrand(e.target.value); setPage(1); }}>
              <option value="">All Brands</option>
              {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
            <select className="filter-select" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c._id} value={String(c._id)}>{c.name}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  {isAdmin && <th>Price</th>}
                  <th>Quantity</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td><div className="sk" style={{ height: 14, width: "70%" }} /></td>
                      <td><div className="sk" style={{ height: 14, width: "50%" }} /></td>
                      {isAdmin && <td><div className="sk" style={{ height: 14, width: "40%" }} /></td>}
                      <td><div className="sk" style={{ height: 14, width: "40%" }} /></td>
                      <td><div className="sk" style={{ height: 22, width: 60, borderRadius: 8 }} /></td>
                      <td><div className="sk" style={{ height: 30, width: 90, borderRadius: 8 }} /></td>
                    </tr>
                  ))
                ) : products.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 6 : 5}>
                    <div className="empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                      <h3>No products found</h3>
                      <p>{search ? "Try a different search term" : "Add your first product to get started"}</p>
                    </div>
                  </td></tr>
                ) : (
                  products.map((p) => {
                    const sc = stockColor(p.currentStock, p.openingStock);
                    const pct = p.openingStock > 0 ? Math.min(100, (p.currentStock / p.openingStock) * 100) : 100;
                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="prod-name" onClick={() => openView(p)}>{p.name}</div>
                          <div className="prod-brand">{p.brand?.name ?? "—"}</div>
                        </td>
                        <td><span className="cat-badge">{p.category?.name ?? "—"}</span></td>
                        {isAdmin && (
                          <td>
                            <div className="price-val">₹{p.price?.toLocaleString() ?? "—"}</div>
                            {p.retailPrice && <div className="price-retail">Retail: ₹{p.retailPrice.toLocaleString()}</div>}
                          </td>
                        )}
                        <td>
                          <span className="qty-val">
                            {p.quantity ? `${p.quantity.value} ${p.quantity.unit}` : "—"} × {p.count}
                          </span>
                        </td>
                        <td>
                          <span className="stock-badge" style={{ background: sc.bg, color: sc.color }}>
                            {p.currentStock} <span style={{ opacity: .6, fontWeight: 400, fontSize: 11 }}>{sc.label}</span>
                          </span>
                          <div className="stock-bar-wrap">
                            <div className="stock-bar" style={{ width: `${pct}%`, background: sc.color }} />
                          </div>
                        </td>
                        <td>
                          <div className="act-btns">
                            <button className="act-btn view" title="View" onClick={() => openView(p)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button className="act-btn edit" title="Edit" onClick={() => openEdit(p)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            {isAdmin && (
                              <button className="act-btn del" title="Delete" onClick={() => openDelete(p)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {!loading && products.length > 0 && !searchDebounced && (
              <div className="pagination">
                <span className="pag-info">Page {page} of {pages} · {total} total</span>
                <div className="pag-btns">
                  <button className="pag-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                    const n = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                    return (
                      <button key={n} className={`pag-btn ${n === page ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>
                    );
                  })}
                  <button className="pag-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Create Modal ── */}
      {modal === "create" && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add New Product</span>
              <button className="modal-close" onClick={closeModal}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="modal-body">
              {formFields}
              {formError && <p className="ferr" style={{ marginTop: 14 }}>{formError}</p>}
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Cancel</button>
              <button className="mbtn primary" disabled={submitting} onClick={handleCreate}>
                <span>{submitting ? "Creating…" : "Create Product"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {modal === "edit" && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Edit Product</span>
              <button className="modal-close" onClick={closeModal}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="modal-body">
              {formFields}
              {formError && <p className="ferr" style={{ marginTop: 14 }}>{formError}</p>}
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Cancel</button>
              <button className="mbtn primary" disabled={submitting} onClick={handleEdit}>
                <span>{submitting ? "Saving…" : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {modal === "delete" && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">Delete Product</span>
              <button className="modal-close" onClick={closeModal}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
                Are you sure you want to delete <strong style={{ color: "#f1f5f9" }}>{selected.name}</strong>? This action will mark it as deleted and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Cancel</button>
              <button className="mbtn danger" disabled={submitting} onClick={handleDelete}>
                {submitting ? "Deleting…" : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {modal === "view" && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{selected.name}</span>
              <button className="modal-close" onClick={closeModal}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Brand</span>
                  <span className="detail-val">{selected.brand?.name ?? "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Category</span>
                  <span className="detail-val">{selected.category?.name ?? "—"}</span>
                </div>
                <hr className="detail-divider" />
                {isAdmin && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">Price</span>
                      <span className="detail-val" style={{ fontFamily: "'JetBrains Mono', monospace" }}>₹{selected.price?.toLocaleString() ?? "—"}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Retail Price</span>
                      <span className="detail-val" style={{ fontFamily: "'JetBrains Mono', monospace" }}>₹{selected.retailPrice?.toLocaleString() ?? "—"}</span>
                    </div>
                  </>
                )}
                <div className="detail-item">
                  <span className="detail-label">Quantity</span>
                  <span className="detail-val">{selected.quantity ? `${selected.quantity.value} ${selected.quantity.unit}` : "—"}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Count per pack</span>
                  <span className="detail-val">{selected.count ?? "—"}</span>
                </div>
                <hr className="detail-divider" />
                <div className="detail-item">
                  <span className="detail-label">Opening Stock</span>
                  <span className="detail-val">{selected.openingStock}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Current Stock</span>
                  {(() => {
                    const sc = stockColor(selected.currentStock, selected.openingStock);
                    return <span className="detail-val" style={{ color: sc.color }}>{selected.currentStock} <span style={{ fontSize: 12, opacity: .7 }}>({sc.label})</span></span>;
                  })()}
                </div>
                {selected.description && (
                  <div className="detail-item full">
                    <span className="detail-label">Description</span>
                    <span className="detail-val" style={{ fontWeight: 400, color: "#94a3b8", lineHeight: 1.6 }}>{selected.description}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-val" style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>
                    {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Close</button>
              <button className="mbtn primary" onClick={() => { closeModal(); openEdit(selected); }}>
                <span>Edit Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success"
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </>
  );
}