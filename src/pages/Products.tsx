import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  addStock,
  getStockHistory,
  editStockEntry,
  deleteStockEntry,
  type CreateProductDTO,
  type UpdateProductDTO,
  type AddStockDTO,
  type EditStockEntryDTO,
  type Product,
  type StockEntry,
  type Quantity,
} from "../api/product";
import { getAllBrands, type Brand } from "../api/brand";
import { getCategories } from "../api/category";
import "../styles/product.css";

/* ─── Local types ──────────────────────────────────────── */
interface Category {
  _id: number;
  name: string;
  description?: string;
}

const UNITS = ["kg", "g", "mg", "litre", "ml", "tablet", "box", "bottle", "piece"] as const;

const emptyProductForm = {
  name: "",
  brandId: "",
  categoryId: "",
  quantityValue: "",
  quantityUnit: "piece" as string,
  description: "",
  flavour: "",
};

const emptyStockForm = {
  count: "",
  price: "",
  retailPrice: "",
  note: "",
  stockDate: "",
};

/* ─── Helpers ─────────────────────────────────────────── */
const stockColor = (current: number) => {
  if (current === 0) return { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Out" };
  if (current <= 10) return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Low" };
  return { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "OK" };
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/* ─── Component ──────────────────────────────────────── */
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

  // stock history
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  // ui
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | "delete" | "view" | "stock" | "stockHistory" | "editEntry" | "deleteEntry" | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null);
  const [productForm, setProductForm] = useState({ ...emptyProductForm });
  const [stockForm, setStockForm] = useState({ ...emptyStockForm });
  const [entryForm, setEntryForm] = useState({
    count: "",
    remainingCount: "",
    price: "",
    retailPrice: "",
    note: "",
    stockDate: "",
  });
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* debounce */
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => setSearchDebounced(search), 400);
  }, [search]);

  /* brands + categories */
  useEffect(() => {
    Promise.allSettled([getAllBrands(), getCategories()]).then(([b, c]) => {
      if (b.status === "fulfilled") setBrands(b.value);
      if (c.status === "fulfilled") setCategories(c.value);
    });
  }, []);

  /* products */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (searchDebounced.trim()) {
        const res = await searchProducts(searchDebounced.trim());
        const arr = Array.isArray(res) ? res : [];
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
        setProducts(res.products ?? []);
        setTotal(res.total ?? 0);
        setPages(res.pages ?? 1);
      }
    } catch {
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, filterBrand, filterCategory]);

  useEffect(() => { load(); }, [load]);

  /* toast */
  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── modal openers ── */
  const openCreate = () => {
    setProductForm({ ...emptyProductForm });
    setFormError("");
    setModal("create");
  };

  const openEdit = (p: Product) => {
    setSelected(p);
    setProductForm({
      name: p.name,
      brandId: p.brand?._id ?? "",
      categoryId: p.category?._id ?? "",
      quantityValue: p.quantity?.value != null ? String(p.quantity.value) : "",
      quantityUnit: p.quantity?.unit ?? "piece",
      description: p.description ?? "",
      flavour: p.flavour ?? "",
    });
    setFormError("");
    setModal("edit");
  };

  const openDelete = (p: Product) => { setSelected(p); setModal("delete"); };
  const openView = (p: Product) => { setSelected(p); setModal("view"); };

  const openAddStock = (p: Product) => {
    setSelected(p);
    setStockForm({ ...emptyStockForm });
    setFormError("");
    setModal("stock");
  };

  const openStockHistory = async (p: Product) => {
    setSelected(p);
    setModal("stockHistory");
    setStockLoading(true);
    try {
      const res = await getStockHistory(p._id);
      setStockEntries(res.entries);
    } catch {
      showToast("Failed to load stock history", "error");
    } finally {
      setStockLoading(false);
    }
  };

  const openEditEntry = (entry: StockEntry) => {
    setSelectedEntry(entry);
    setEntryForm({
      count: String(entry.count),
      remainingCount: String(entry.remainingCount),
      price: entry.price != null ? String(entry.price) : "",
      retailPrice: entry.retailPrice != null ? String(entry.retailPrice) : "",
      note: entry.note ?? "",
      stockDate: entry.stockDate
        ? new Date(entry.stockDate).toISOString().split("T")[0]
        : new Date(entry.createdAt).toISOString().split("T")[0],
    });
    setFormError("");
    setModal("editEntry");
  };

  const openDeleteEntry = (entry: StockEntry) => {
    setSelectedEntry(entry);
    setModal("deleteEntry");
  };

  const closeModal = () => {
    setModal(null);
    setSelected(null);
    setSelectedEntry(null);
    setStockEntries([]);
  };

  /* ── create product ── */
  const handleCreate = async () => {
    if (!productForm.name || !productForm.brandId || !productForm.categoryId) {
      setFormError("Name, brand and category are required.");
      return;
    }
    setSubmitting(true);
    try {
      const dto: CreateProductDTO = {
        name: productForm.name,
        brandId: productForm.brandId,
        categoryId: productForm.categoryId,
        description: productForm.description || undefined,
        flavour: productForm.flavour || undefined,
        ...(productForm.quantityValue
          ? { quantity: { value: Number(productForm.quantityValue), unit: productForm.quantityUnit as Quantity["unit"] } }
          : {}),
      };
      await createProduct(dto);
      showToast("Product created — add its first stock batch now", "success");
      closeModal();
      load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setFormError(e?.response?.data?.message || e.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── edit product ── */
  const handleEdit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const dto: UpdateProductDTO = {
        name: productForm.name || undefined,
        brandId: productForm.brandId || undefined,
        categoryId: productForm.categoryId || undefined,
        description: productForm.description || undefined,
        flavour: productForm.flavour || undefined,
        ...(productForm.quantityValue
          ? { quantity: { value: Number(productForm.quantityValue), unit: productForm.quantityUnit as Quantity["unit"] } }
          : {}),
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

  /* ── delete product ── */
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

  /* ── add stock ── */
  const handleAddStock = async () => {
    if (!selected) return;
    if (!stockForm.count || Number(stockForm.count) < 1) {
      setFormError("Count must be at least 1.");
      return;
    }
    if (isAdmin && !stockForm.price) {
      setFormError("Admin must set a cost price for this batch.");
      return;
    }
    setSubmitting(true);
    try {
      const dto: AddStockDTO = {
        count: Number(stockForm.count),
        note: stockForm.note || undefined,
        stockDate: stockForm.stockDate || undefined,
        ...(stockForm.price ? { price: Number(stockForm.price) } : {}),
        ...(stockForm.retailPrice ? { retailPrice: Number(stockForm.retailPrice) } : {}),
      };
      await addStock(selected._id, dto);
      showToast("Stock batch added successfully", "success");
      closeModal();
      load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setFormError(e?.response?.data?.message || e.message || "Failed to add stock");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── edit stock entry ── */
  const handleEditEntry = async () => {
    if (!selected || !selectedEntry) return;

    const countVal = Number(entryForm.count);
    const remainingVal = Number(entryForm.remainingCount);

    if (entryForm.count === "" || countVal < 0) {
      setFormError("Count cannot be negative.");
      return;
    }
    if (entryForm.remainingCount === "" || remainingVal < 0) {
      setFormError("Remaining count cannot be negative.");
      return;
    }
    if (remainingVal > countVal) {
      setFormError("Remaining count cannot exceed total count.");
      return;
    }

    setSubmitting(true);
    try {
      const dto: EditStockEntryDTO = {
        count: countVal,
        remainingCount: remainingVal,
        note: entryForm.note || undefined,
        stockDate: entryForm.stockDate || undefined,
        ...(entryForm.price ? { price: Number(entryForm.price) } : {}),
        ...(entryForm.retailPrice ? { retailPrice: Number(entryForm.retailPrice) } : {}),
      };
      await editStockEntry(selected._id, selectedEntry._id, dto);
      showToast("Stock entry updated", "success");
      const res = await getStockHistory(selected._id);
      setStockEntries(res.entries);
      load();
      setSelectedEntry(null);
      setFormError("");
      setModal("stockHistory");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setFormError(e?.response?.data?.message || e.message || "Failed to update entry");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── delete stock entry ── */
  const handleDeleteEntry = async () => {
    if (!selected || !selectedEntry) return;
    setSubmitting(true);
    try {
      await deleteStockEntry(selected._id, selectedEntry._id);
      showToast("Stock entry deleted", "success");
      const res = await getStockHistory(selected._id);
      setStockEntries(res.entries);
      load();
      setSelectedEntry(null);
      setModal("stockHistory");
    } catch {
      showToast("Failed to delete stock entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── field helpers ── */
  const pf = (k: keyof typeof emptyProductForm) => productForm[k];
  const setPF = (k: keyof typeof emptyProductForm, v: string) =>
    setProductForm((prev) => ({ ...prev, [k]: v }));

  const sf = (k: keyof typeof emptyStockForm) => stockForm[k];
  const setSF = (k: keyof typeof emptyStockForm, v: string) =>
    setStockForm((prev) => ({ ...prev, [k]: v }));

  /* ── nav ── */
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

  /* ── shared product form fields ── */
  const productFormFields = (
    <div className="form-grid">
      <div className="form-group full">
        <label className="flabel">Product Name *</label>
        <input className="finput" placeholder="e.g. Whey Protein 2kg" value={pf("name")} onChange={e => setPF("name", e.target.value)} />
      </div>
      <div className="form-group">
        <label className="flabel">Brand *</label>
        <select className="finput" value={pf("brandId")} onChange={e => setPF("brandId", e.target.value)}>
          <option value="">Select brand</option>
          {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="flabel">Category *</label>
        <select className="finput" value={pf("categoryId")} onChange={e => setPF("categoryId", e.target.value)}>
          <option value="">Select category</option>
          {categories.map(c => <option key={c._id} value={String(c._id)}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="flabel">Flavour</label>
        <input className="finput" placeholder="e.g. Chocolate, Orange" value={pf("flavour")} onChange={e => setPF("flavour", e.target.value)} />
      </div>
      <div className="form-group">
        <label className="flabel">Quantity Value</label>
        <input className="finput" type="number" min="0" placeholder="e.g. 2" value={pf("quantityValue")} onChange={e => setPF("quantityValue", e.target.value)} />
      </div>
      <div className="form-group">
        <label className="flabel">Quantity Unit</label>
        <select className="finput" value={pf("quantityUnit")} onChange={e => setPF("quantityUnit", e.target.value)}>
          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div className="form-group full">
        <label className="flabel">Description</label>
        <textarea className="finput ftextarea" rows={3} placeholder="Optional description…" value={pf("description")} onChange={e => setPF("description", e.target.value)} />
      </div>
      <div className="form-group full">
        <div className="info-hint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Price and stock quantity are managed per stock batch. Use <strong>Add Stock</strong> after saving.
        </div>
      </div>
    </div>
  );

  /* ── stock batch form ── */
  const stockFormFields = (
    <div className="form-grid">
      <div className="form-group full">
        <label className="flabel">Stock Date</label>
        <input
          className="finput"
          type="date"
          value={sf("stockDate")}
          onChange={e => setSF("stockDate", e.target.value)}
        />
      </div>
      <div className="form-group full">
        <label className="flabel">Count (units in this batch) *</label>
        <input className="finput" type="number" min="1" placeholder="e.g. 50" value={sf("count")} onChange={e => setSF("count", e.target.value)} />
      </div>
      {isAdmin && (
        <div className="form-group">
          <label className="flabel">Cost Price (₹) *</label>
          <input className="finput" type="number" min="0" placeholder="0.00" value={sf("price")} onChange={e => setSF("price", e.target.value)} />
        </div>
      )}
      {(
        <div className="form-group">
          <label className="flabel">Retail Price (₹)</label>
          <input className="finput" type="number" min="0" placeholder="0.00" value={sf("retailPrice")} onChange={e => setSF("retailPrice", e.target.value)} />
        </div>
      )}
      <div className="form-group full">
        <label className="flabel">Note</label>
        <input className="finput" placeholder="e.g. Supplier: XYZ, Batch #42" value={sf("note")} onChange={e => setSF("note", e.target.value)} />
      </div>
    </div>
  );

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
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

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="skeleton-row">
                        <td><div className="sk" style={{ height: 14, width: "70%" }} /></td>
                        <td><div className="sk" style={{ height: 14, width: "50%" }} /></td>
                        <td><div className="sk" style={{ height: 14, width: "40%" }} /></td>
                        <td><div className="sk" style={{ height: 14, width: "40%" }} /></td>
                        <td><div className="sk" style={{ height: 22, width: 60, borderRadius: 8 }} /></td>
                        <td><div className="sk" style={{ height: 30, width: 90, borderRadius: 8 }} /></td>
                      </tr>
                    ))
                  : products.length === 0
                  ? (
                    <tr><td colSpan={6}>
                      <div className="empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        <h3>No products found</h3>
                        <p>{search ? "Try a different search term" : "Add your first product to get started"}</p>
                      </div>
                    </td></tr>
                  )
                  : products.map((p) => {
                      const stock = p.currentStock ?? p.stockSummary?.currentStock ?? 0;
                      const sc = stockColor(stock);
                      const latestPrice = p.priceSummary?.latestPrice;
                      const latestRetail = p.priceSummary?.latestRetailPrice;
                      const batches = p.stockSummary?.totalBatches ?? 0;
                      return (
                        <tr key={p._id}>
                          <td>
                            <div className="prod-name" onClick={() => openView(p)}>
                              <div className="product-name-wrap">
                                <span className="product-name">{p.name}</span>
                                {p.flavour && p.flavour !== "none" && (
                                  <span className="flavour-badge">{p.flavour}</span>
                                )}
                              </div>
                            </div>
                            <div className="prod-brand">{p.brand?.name ?? "—"}</div>
                          </td>
                          <td><span className="cat-badge">{p.category?.name ?? "—"}</span></td>
                          <td>
                            {latestRetail != null
                              ? <div className="price-retail-primary">{fmt(latestRetail)}</div>
                              : <div className="price-retail-primary price-empty">—</div>}
                            {isAdmin && latestPrice != null && (
                              <div className="price-cost-secondary">Cost: {fmt(latestPrice)}</div>
                            )}
                            {isAdmin && batches > 1 && p.priceSummary && (
                              <div className="price-range-hint">
                                {fmt(p.priceSummary.priceRange.min)} – {fmt(p.priceSummary.priceRange.max)}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className="qty-val">
                              {p.quantity ? `${p.quantity.value} ${p.quantity.unit}` : "—"}
                            </span>
                          </td>
                          <td>
                            <span className="stock-badge" style={{ background: sc.bg, color: sc.color }}>
                              {stock} <span style={{ opacity: .6, fontWeight: 400, fontSize: 11 }}>{sc.label}</span>
                            </span>
                            {batches > 0 && (
                              <div className="batch-hint">{batches} batch{batches !== 1 ? "es" : ""}</div>
                            )}
                          </td>
                          <td>
                            <div className="act-btns">
                              <button className="act-btn view" title="View details" onClick={() => openView(p)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                              <button className="act-btn stock-btn" title="Add stock batch" onClick={() => openAddStock(p)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                              </button>
                              <button className="act-btn history-btn" title="Stock history" onClick={() => openStockHistory(p)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                              </button>
                              <button className="act-btn edit" title="Edit product" onClick={() => openEdit(p)}>
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
                }
              </tbody>
            </table>

            {!loading && products.length > 0 && !searchDebounced && (
              <div className="pagination">
                <span className="pag-info">Page {page} of {pages} · {total} total</span>
                <div className="pag-btns">
                  <button className="pag-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                    const n = pages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pages - 2 ? pages - 4 + i : page - 2 + i;
                    return <button key={n} className={`pag-btn ${n === page ? "active" : ""}`} onClick={() => setPage(n)}>{n}</button>;
                  })}
                  <button className="pag-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════
          CREATE MODAL
      ══════════════════════════════════════ */}
      {modal === "create" && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Add New Product</span>
              <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
            </div>
            <div className="modal-body">{productFormFields}{formError && <p className="ferr" style={{ marginTop: 14 }}>{formError}</p>}</div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Cancel</button>
              <button className="mbtn primary" disabled={submitting} onClick={handleCreate}>
                {submitting ? "Creating…" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════ */}
      {modal === "edit" && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Edit Product</span>
              <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
            </div>
            <div className="modal-body">{productFormFields}{formError && <p className="ferr" style={{ marginTop: 14 }}>{formError}</p>}</div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Cancel</button>
              <button className="mbtn primary" disabled={submitting} onClick={handleEdit}>
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          ADD STOCK MODAL
      ══════════════════════════════════════ */}
      {modal === "stock" && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <span className="modal-title">Add Stock Batch</span>
                <div className="modal-subtitle">{selected.name}{selected.flavour && selected.flavour !== "none" ? ` · ${selected.flavour}` : ""}</div>
              </div>
              <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              {stockFormFields}
              {!isAdmin && (
                <div className="info-hint" style={{ marginTop: 12 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Cost price and retail price will be set by Admin after this batch is recorded.
                </div>
              )}
              {formError && <p className="ferr" style={{ marginTop: 14 }}>{formError}</p>}
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Cancel</button>
              <button className="mbtn primary" disabled={submitting} onClick={handleAddStock}>
                {submitting ? "Adding…" : "Add Stock Batch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          STOCK HISTORY MODAL
      ══════════════════════════════════════ */}
      {modal === "stockHistory" && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal-wide">
            <div className="modal-header">
              <div>
                <span className="modal-title">Stock History</span>
                <div className="modal-subtitle">{selected.name}</div>
              </div>
              <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="stock-summary-row">
                <div className="stock-summary-chip">
                  <span className="ssc-label">Current Stock</span>
                  <span className="ssc-val" style={{ color: stockColor(selected.currentStock ?? 0).color }}>
                    {selected.currentStock ?? 0}
                  </span>
                </div>
                <div className="stock-summary-chip">
                  <span className="ssc-label">Total Batches</span>
                  <span className="ssc-val">{selected.stockSummary?.totalBatches ?? "—"}</span>
                </div>
                {selected.priceSummary?.latestRetailPrice != null && (
                  <div className="stock-summary-chip">
                    <span className="ssc-label">Retail Price</span>
                    <span className="ssc-val">{fmt(selected.priceSummary.latestRetailPrice)}</span>
                  </div>
                )}
              </div>

              {stockLoading ? (
                <div className="stock-loading">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="sk" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />
                  ))}
                </div>
              ) : stockEntries.length === 0 ? (
                <div className="empty" style={{ padding: "32px 0" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  <h3>No stock batches yet</h3>
                  <p>Add the first batch to track inventory</p>
                </div>
              ) : (
                <div className="stock-entries-table-wrap">
                  <table className="stock-entries-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Stock Date</th>
                        <th>Count</th>
                        <th>Remaining</th>
                        {isAdmin && <th>Cost Price</th>}
                        <th>Retail Price</th>
                        <th>Note</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockEntries.map((e, idx) => (
                        <tr key={e._id}>
                          <td className="batch-num">#{stockEntries.length - idx}</td>
                          <td style={{ fontSize: 12, color: "#94a3b8" }}>
                            {fmtDate(e.stockDate || e.createdAt)}
                          </td>
                          <td><span className="batch-count">{e.count}</span></td>
                          <td>
                            <span
                              className="batch-remaining"
                              style={{ color: e.remainingCount === 0 ? "#ef4444" : e.remainingCount < e.count * 0.2 ? "#f59e0b" : "#10b981" }}
                            >
                              {e.remainingCount}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="price-cell">
                              {e.price != null ? fmt(e.price) : <span className="price-unset">Not set</span>}
                            </td>
                          )}
                          <td className="price-cell">
                            {e.retailPrice != null ? fmt(e.retailPrice) : "—"}
                          </td>
                          <td style={{ fontSize: 12, color: "#64748b" }}>{e.note || "—"}</td>
                          <td>
                            <div className="act-btns">
                              <button className="act-btn edit" title="Edit batch" onClick={() => openEditEntry(e)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              {isAdmin && (
                                <button className="act-btn del" title="Delete batch" onClick={() => openDeleteEntry(e)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Close</button>
              <button className="mbtn primary" onClick={() => { closeModal(); openAddStock(selected); }}>
                + Add New Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EDIT STOCK ENTRY MODAL
      ══════════════════════════════════════ */}
      {modal === "editEntry" && selectedEntry && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal("stockHistory")}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div>
                <span className="modal-title">Edit Stock Batch</span>
                <div className="modal-subtitle">
                  #{stockEntries.length - stockEntries.findIndex(e => e._id === selectedEntry._id)} · {selected.name}
                </div>
              </div>
              <button className="modal-close" onClick={() => { setModal("stockHistory"); setFormError(""); }}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="flabel">Stock Date</label>
                  <input
                    className="finput"
                    type="date"
                    value={entryForm.stockDate}
                    onChange={e => setEntryForm(prev => ({ ...prev, stockDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="flabel">Count *</label>
                  <input
                    className="finput"
                    type="number"
                    min="0"
                    value={entryForm.count}
                    onChange={e => setEntryForm(prev => ({ ...prev, count: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="flabel">Remaining Count *</label>
                  <input
                    className="finput"
                    type="number"
                    min="0"
                    max={entryForm.count}
                    placeholder={`0 – ${entryForm.count}`}
                    value={entryForm.remainingCount}
                    onChange={e => setEntryForm(prev => ({ ...prev, remainingCount: e.target.value }))}
                  />
                </div>
                {isAdmin && (
                  <div className="form-group">
                    <label className="flabel">Cost Price (₹)</label>
                    <input
                      className="finput"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={entryForm.price}
                      onChange={e => setEntryForm(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                )}
                {isAdmin && (
                  <div className="form-group">
                    <label className="flabel">Retail Price (₹)</label>
                    <input
                      className="finput"
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={entryForm.retailPrice}
                      onChange={e => setEntryForm(prev => ({ ...prev, retailPrice: e.target.value }))}
                    />
                  </div>
                )}
                <div className="form-group full">
                  <label className="flabel">Note</label>
                  <input
                    className="finput"
                    placeholder="e.g. Supplier: XYZ, Batch #42"
                    value={entryForm.note}
                    onChange={e => setEntryForm(prev => ({ ...prev, note: e.target.value }))}
                  />
                </div>
              </div>
              {Number(entryForm.remainingCount) === 0 && (
                <div className="info-hint" style={{ marginTop: 12 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>
                    Remaining count is <strong style={{ color: "#ef4444" }}>0</strong> — this batch will be marked as fully sold out.
                  </span>
                </div>
              )}
              {entryForm.remainingCount !== "" && entryForm.count !== "" && Number(entryForm.remainingCount) > Number(entryForm.count) && (
                <div className="info-hint" style={{ marginTop: 12 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span style={{ color: "#ef4444" }}>
                    Remaining count cannot exceed total count.
                  </span>
                </div>
              )}
              {formError && <p className="ferr" style={{ marginTop: 14 }}>{formError}</p>}
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={() => { setModal("stockHistory"); setFormError(""); }}>Cancel</button>
              <button className="mbtn primary" disabled={submitting} onClick={handleEditEntry}>
                {submitting ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          DELETE STOCK ENTRY MODAL
      ══════════════════════════════════════ */}
      {modal === "deleteEntry" && selectedEntry && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setModal("stockHistory")}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">Delete Stock Batch</span>
              <button className="modal-close" onClick={() => setModal("stockHistory")}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
                Are you sure you want to delete this batch of{" "}
                <strong style={{ color: "#f1f5f9" }}>{selectedEntry.count} units</strong> added on{" "}
                <strong style={{ color: "#f1f5f9" }}>{fmtDate(selectedEntry.stockDate || selectedEntry.createdAt)}</strong>?
              </p>
              <div className="info-hint" style={{ marginTop: 14 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Only the remaining <strong style={{ color: "#c7d2fe" }}>{selectedEntry.remainingCount} unsold units</strong> will be deducted from current stock.
              </div>
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={() => setModal("stockHistory")}>Cancel</button>
              <button className="mbtn danger" disabled={submitting} onClick={handleDeleteEntry}>
                {submitting ? "Deleting…" : "Delete Batch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════ */}
      {modal === "view" && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <span className="modal-title">{selected.name}</span>
                {selected.flavour && selected.flavour !== "none" && (
                  <span className="modal-flavour-badge">{selected.flavour}</span>
                )}
              </div>
              <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
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
                <div className="detail-item">
                  <span className="detail-label">Quantity</span>
                  <span className="detail-val">
                    {selected.quantity ? `${selected.quantity.value} ${selected.quantity.unit}` : "—"}
                  </span>
                </div>
                {selected.flavour && selected.flavour !== "none" && (
                  <div className="detail-item">
                    <span className="detail-label">Flavour</span>
                    <span className="detail-val">{selected.flavour}</span>
                  </div>
                )}
                <hr className="detail-divider" />

                <div className="detail-item">
                  <span className="detail-label">Current Stock</span>
                  <span className="detail-val" style={{ color: stockColor(selected.currentStock ?? 0).color }}>
                    {selected.currentStock ?? 0}
                    <span style={{ fontSize: 12, opacity: .7, marginLeft: 6 }}>
                      ({stockColor(selected.currentStock ?? 0).label})
                    </span>
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Active Batches</span>
                  <span className="detail-val">{selected.stockSummary?.totalBatches ?? 0}</span>
                </div>
                {selected.stockSummary?.lastRestocked && (
                  <div className="detail-item">
                    <span className="detail-label">Last Restocked</span>
                    <span className="detail-val" style={{ fontSize: 13, color: "#94a3b8" }}>
                      {fmtDate(selected.stockSummary.lastRestocked)}
                    </span>
                  </div>
                )}
                <hr className="detail-divider" />

                {selected.priceSummary?.latestRetailPrice != null && (
                  <div className="detail-item">
                    <span className="detail-label">Retail Price</span>
                    <span className="detail-val mono">{fmt(selected.priceSummary.latestRetailPrice)}</span>
                  </div>
                )}
                {isAdmin && selected.priceSummary && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">
                        Latest Cost Price
                        <span className="admin-only-tag">Admin</span>
                      </span>
                      <span className="detail-val mono">{fmt(selected.priceSummary.latestPrice)}</span>
                    </div>
                    {selected.priceSummary.priceRange.min !== selected.priceSummary.priceRange.max && (
                      <div className="detail-item full">
                        <span className="detail-label">Cost Price Range (active batches)</span>
                        <span className="detail-val mono">
                          {fmt(selected.priceSummary.priceRange.min)} – {fmt(selected.priceSummary.priceRange.max)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {selected.priceSummary != null && <hr className="detail-divider" />}

                {selected.description && (
                  <div className="detail-item full">
                    <span className="detail-label">Description</span>
                    <span className="detail-val" style={{ fontWeight: 400, color: "#94a3b8", lineHeight: 1.6 }}>
                      {selected.description}
                    </span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-val" style={{ fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>
                    {selected.createdAt ? fmtDate(selected.createdAt) : "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="mbtn cancel" onClick={closeModal}>Close</button>
              <button className="mbtn secondary" onClick={() => { closeModal(); openStockHistory(selected); }}>
                Stock History
              </button>
              <button className="mbtn primary" onClick={() => { closeModal(); openEdit(selected); }}>
                Edit Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          DELETE PRODUCT MODAL
      ══════════════════════════════════════ */}
      {modal === "delete" && selected && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">Delete Product</span>
              <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
                Are you sure you want to delete{" "}
                <strong style={{ color: "#f1f5f9" }}>{selected.name}</strong>? This will mark it as
                deleted and cannot be undone.
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

/* ── Shared icon ── */
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}