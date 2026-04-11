import { useState, useEffect, useCallback, useRef } from "react";
import { addCategory, getCategories, updateCategory, deleteCategory } from "../api/category";

import Sidebar   from "../components/SideBar";
import PageHeader from "../components/PageHeader";
import Modal     from "../components/Modal";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/brand.css";

/* ─── Types ──────────────────────────────────────────────── */
interface Category { _id: number; name: string; description?: string; }

/* ─── Helpers ────────────────────────────────────────────── */
const CAT_COLORS = [
  { color: "#3b82f6", bg: "rgba(59,130,246,0.15)"  },
  { color: "#10b981", bg: "rgba(16,185,129,0.15)"  },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
  { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  { color: "#f43f5e", bg: "rgba(244,63,94,0.15)"   },
  { color: "#06b6d4", bg: "rgba(6,182,212,0.15)"   },
];
const getColor  = (name: string) => CAT_COLORS[name.charCodeAt(0) % CAT_COLORS.length];
const emptyForm = { name: "", description: "" };

const NAV_ITEMS = [
  { label: "Dashboard",  path: "/" },
  { label: "Products",   path: "/products" },
  { label: "Brands",     path: "/brands" },
  { label: "Categories", path: "/categories", active: true },
];

/* ─── Component ──────────────────────────────────────────── */
export default function Categories() {
  const user    = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = !!user.isAdmin;

  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered,   setFiltered]   = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search,    setSearch]    = useState("");
  const [modal,    setModal]    = useState<"create"|"edit"|"delete"|"view"|null>(null);
  const [selected, setSelected] = useState<Category | null>(null);
  const [form,      setForm]      = useState({ ...emptyForm });
  const [formError, setFormError] = useState("");
  const { toast, showToast } = useToast();
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Load ─── */
  const load = useCallback(async () => {
    setLoading(true);
    try   { setCategories(await getCategories()); }
    catch { showToast("Failed to load categories", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ─── Client search ─── */
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      const q = search.toLowerCase().trim();
      setFiltered(q ? categories.filter(c => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q)) : categories);
    }, 300);
  }, [search, categories]);

  /* ─── Modals ─── */
  const openCreate = () => { setForm({ ...emptyForm }); setFormError(""); setModal("create"); };
  const openEdit   = (c: Category) => { setSelected(c); setForm({ name: c.name, description: c.description ?? "" }); setFormError(""); setModal("edit"); };
  const openDelete = (c: Category) => { setSelected(c); setModal("delete"); };
  const openView   = (c: Category) => { setSelected(c); setModal("view"); };
  const closeModal = () => { setModal(null); setSelected(null); };
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  /* ─── CRUD ─── */
  const handleCreate = async () => {
    if (!form.name.trim()) { setFormError("Category name is required."); return; }
    setSubmitting(true);
    try {
      await addCategory({ name: form.name.trim(), description: form.description || undefined });
      showToast("Category created successfully", "success"); closeModal(); load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { setFormError(e?.response?.data?.message || e.message || "Failed to create"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!selected || !form.name.trim()) { setFormError("Category name is required."); return; }
    setSubmitting(true);
    try {
      await updateCategory(selected._id, { name: form.name.trim(), description: form.description || undefined });
      showToast("Category updated", "success"); closeModal(); load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { setFormError(e?.response?.data?.message || e.message || "Failed to update"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try   { await deleteCategory(selected._id); showToast("Category deleted", "success"); closeModal(); load(); }
    catch { showToast("Failed to delete category", "error"); }
    finally { setSubmitting(false); }
  };

  /* ─── Form body (inlined JSX var preserves input focus) ─── */
  const formBody = (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      <div className="fg">
        <label className="fl">Category Name *</label>
        <input className="fi" placeholder="e.g. Antibiotics" value={form.name} onChange={e => setF("name", e.target.value)} />
      </div>
      <div className="fg">
        <label className="fl">Description</label>
        <textarea className="fi fta" rows={3} placeholder="Optional description…" value={form.description} onChange={e => setF("description", e.target.value)} />
      </div>
      {formError && <p className="ferr">{formError}</p>}
    </div>
  );

  /* ════ RENDER ════ */
  return (
    <>
      <div className="br-root">
        <Sidebar navItems={NAV_ITEMS} />

        <main className="main">
          <PageHeader
            title="Category Directory"
            subtitle={loading ? "Loading…" : `${filtered.length} categor${filtered.length !== 1 ? "ies" : "y"}${search ? " matching search" : " total"}`}
            addLabel="Add Category"
            onAdd={openCreate}
          />

          {/* Stat strip */}
          <div className="stat-strip">
            {[
              { label: "Total Categories", val: categories.length,                          color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
              { label: "With Description",  val: categories.filter(c => !!c.description).length,  color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
              { label: "No Description",   val: categories.filter(c => !c.description).length,   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
            ].map(s => (
              <div key={s.label} className="sp">
                <div className="sp-ic" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  {loading ? <div className="sk" style={{ height: 22, width: 36, marginBottom: 5 }} /> : <div className="sp-val" style={{ color: s.color }}>{s.val}</div>}
                  <div className="sp-lbl">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="sw">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="si" placeholder="Search categories…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Table */}
          <div className="tw">
            <table>
              <thead><tr><th>Category</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div className="sk" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} /><div className="sk" style={{ height: 14, width: 130 }} /></div></td>
                      <td><div className="sk" style={{ height: 13, width: 220 }} /></td>
                      <td><div style={{ display: "flex", gap: 6 }}><div className="sk" style={{ width: 30, height: 30, borderRadius: 7 }} /><div className="sk" style={{ width: 30, height: 30, borderRadius: 7 }} /><div className="sk" style={{ width: 30, height: 30, borderRadius: 7 }} /></div></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={3}>
                    <div className="empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      <h3>No categories found</h3>
                      <p>{search ? "Try adjusting your search" : "Add your first category to get started"}</p>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map(c => {
                    const col = getColor(c.name);
                    return (
                      <tr key={c._id} onClick={() => openView(c)}>
                        <td>
                          <div className="t-nc">
                            <div className="t-av" style={{ background: col.bg, color: col.color }}>{c.name[0].toUpperCase()}</div>
                            <span className="t-bn">{c.name}</span>
                          </div>
                        </td>
                        <td><span className="t-desc">{c.description || <span style={{ color: "var(--mt)", fontStyle: "italic" }}>No description</span>}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="act-btns">
                            <button className="ab v" title="View" onClick={() => openView(c)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                            <button className="ab e" title="Edit" onClick={() => openEdit(c)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                            {isAdmin && (
                              <button className="ab d" title="Delete" onClick={() => openDelete(c)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* ── CREATE ── */}
      {modal === "create" && (
        <Modal title="Add New Category" onClose={closeModal} footer={
          <>
            <button className="mbtn cn" onClick={closeModal}>Cancel</button>
            <button className="mbtn pr" disabled={submitting} onClick={handleCreate}>{submitting ? "Creating…" : "Create Category"}</button>
          </>
        }>
          {formBody}
        </Modal>
      )}

      {/* ── EDIT ── */}
      {modal === "edit" && (
        <Modal title="Edit Category" onClose={closeModal} footer={
          <>
            <button className="mbtn cn" onClick={closeModal}>Cancel</button>
            <button className="mbtn pr" disabled={submitting} onClick={handleEdit}>{submitting ? "Saving…" : "Save Changes"}</button>
          </>
        }>
          {formBody}
        </Modal>
      )}

      {/* ── DELETE ── */}
      {modal === "delete" && selected && (
        <Modal title="Delete Category" size="modal-sm" onClose={closeModal} footer={
          <>
            <button className="mbtn cn" onClick={closeModal}>Cancel</button>
            <button className="mbtn dr" disabled={submitting} onClick={handleDelete}>{submitting ? "Deleting…" : "Delete Category"}</button>
          </>
        }>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
            Are you sure you want to delete <strong style={{ color: "#f1f5f9" }}>{selected.name}</strong>?
            This will soft-delete the category and it will no longer appear in listings.
          </p>
        </Modal>
      )}

      {/* ── VIEW ── */}
      {modal === "view" && selected && (() => {
        const col = getColor(selected.name);
        return (
          <Modal title="Category Details" onClose={closeModal} footer={
            <>
              <button className="mbtn cn" onClick={closeModal}>Close</button>
              <button className="mbtn pr" onClick={() => { closeModal(); openEdit(selected); }}>Edit Category</button>
            </>
          }>
            <div className="vh">
              <div className="v-av" style={{ background: col.bg, color: col.color }}>{selected.name[0].toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.3px", marginBottom: 6 }}>{selected.name}</div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, background: col.bg, color: col.color }}>
                  Category
                </span>
              </div>
            </div>
            <div className="dg">
              <div className="di"><span className="dl">Category ID</span><span className="dv" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#64748b" }}>{selected._id}</span></div>
              <div className="di"><span className="dl">Status</span><span className="dv" style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />Active</span></div>
              {selected.description && (
                <div className="di full"><span className="dl">Description</span><span className="dv" style={{ fontWeight: 400, color: "#94a3b8", lineHeight: 1.6, fontSize: 13 }}>{selected.description}</span></div>
              )}
            </div>
          </Modal>
        );
      })()}

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  );
}