import { useState, useEffect, useCallback, useRef } from "react";
import {
  getAllBrands, createBrand, updateBrand, deleteBrand, filterBrands,
  type Brand, type CreateBrandDTO, type UpdateBrandDTO,
} from "../api/brand";

import Sidebar   from "../components/SideBar";
import PageHeader from "../components/PageHeader";
import Modal     from "../components/Modal";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";
import "../styles/brand.css";

/* ─── Helpers ────────────────────────────────────────────── */
const BRAND_COLORS = [
  { color: "#3b82f6", bg: "rgba(59,130,246,0.15)"  },
  { color: "#10b981", bg: "rgba(16,185,129,0.15)"  },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
  { color: "#a78bfa", bg: "rgba(167,139,250,0.15)" },
  { color: "#f43f5e", bg: "rgba(244,63,94,0.15)"   },
  { color: "#06b6d4", bg: "rgba(6,182,212,0.15)"   },
];
const getColor  = (name: string) => BRAND_COLORS[name.charCodeAt(0) % BRAND_COLORS.length];
const emptyForm = { name: "", type: "imported", description: "" };

const NAV_ITEMS = [
  { label: "Dashboard",  path: "/" },
  { label: "Products",   path: "/products" },
  { label: "Brands",     path: "/brands", active: true },
  { label: "Categories", path: "/categories" },
];

/* ─── Component ──────────────────────────────────────────── */
export default function Brands() {
  const user    = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = !!user.isAdmin;

  const [brands,     setBrands]     = useState<Brand[]>([]);
  const [filtered,   setFiltered]   = useState<Brand[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("");
  const [modal,    setModal]    = useState<"create"|"edit"|"delete"|"view"|null>(null);
  const [selected, setSelected] = useState<Brand | null>(null);
  const [form,      setForm]      = useState({ ...emptyForm });
  const [formError, setFormError] = useState("");
  const { toast, showToast } = useToast();
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Load ─── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = filterType ? await filterBrands({ type: filterType }) : await getAllBrands();
      setBrands(data);
    } catch { showToast("Failed to load brands", "error"); }
    finally  { setLoading(false); }
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  /* ─── Client search ─── */
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      const q = search.toLowerCase().trim();
      setFiltered(q ? brands.filter(b => b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q)) : brands);
    }, 300);
  }, [search, brands]);

  /* ─── Modals ─── */
  const openCreate = () => { setForm({ ...emptyForm }); setFormError(""); setModal("create"); };
  const openEdit   = (b: Brand) => { setSelected(b); setForm({ name: b.name, type: b.type, description: b.description ?? "" }); setFormError(""); setModal("edit"); };
  const openDelete = (b: Brand) => { setSelected(b); setModal("delete"); };
  const openView   = (b: Brand) => { setSelected(b); setModal("view"); };
  const closeModal = () => { setModal(null); setSelected(null); };
  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  /* ─── CRUD ─── */
  const handleCreate = async () => {
    if (!form.name.trim()) { setFormError("Brand name is required."); return; }
    setSubmitting(true);
    try {
      await createBrand({ name: form.name.trim(), type: form.type, description: form.description || undefined } as CreateBrandDTO);
      showToast("Brand created successfully", "success"); closeModal(); load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { setFormError(e?.response?.data?.message || e.message || "Failed to create"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async () => {
    if (!selected || !form.name.trim()) { setFormError("Brand name is required."); return; }
    setSubmitting(true);
    try {
      await updateBrand(selected._id, { name: form.name.trim(), type: form.type, description: form.description || undefined } as UpdateBrandDTO);
      showToast("Brand updated", "success"); closeModal(); load();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { setFormError(e?.response?.data?.message || e.message || "Failed to update"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSubmitting(true);
    try   { await deleteBrand(selected._id); showToast("Brand deleted", "success"); closeModal(); load(); }
    catch { showToast("Failed to delete brand", "error"); }
    finally { setSubmitting(false); }
  };

  /* ─── Derived ─── */
  const totalImported = brands.filter(b => b.type === "imported").length;
  const totalLocal    = brands.filter(b => b.type === "local").length;

  /* ─── Form body (inlined JSX var preserves input focus) ─── */
  const formBody = (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
      <div className="fg">
        <label className="fl">Brand Name *</label>
        <input className="fi" placeholder="e.g. Sun Pharma" value={form.name} onChange={e => setF("name", e.target.value)} />
      </div>
      <div className="fg">
        <label className="fl">Brand Type *</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {(["imported", "local"] as const).map(t => (
            <div
              key={t}
              onClick={() => setF("type", t)}
              style={{
                padding: "12px",
                border: `1px solid ${form.type === t ? (t === "imported" ? "#a78bfa" : "#10b981") : "rgba(255,255,255,0.06)"}`,
                borderRadius: 10, cursor: "pointer", textAlign: "center" as const,
                background: form.type === t ? (t === "imported" ? "rgba(167,139,250,0.1)" : "rgba(16,185,129,0.1)") : "#161b27",
                transition: "all .18s",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: form.type === t ? (t === "imported" ? "#a78bfa" : "#10b981") : "#f1f5f9", marginBottom: 2 }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
              <div style={{ fontSize: 11, color: "#475569" }}>{t === "imported" ? "International brand" : "Domestic brand"}</div>
            </div>
          ))}
        </div>
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
            title="Brand Directory"
            subtitle={loading ? "Loading…" : `${filtered.length} brand${filtered.length !== 1 ? "s" : ""}${filterType || search ? " matching filters" : " total"}`}
            addLabel="Add Brand"
            onAdd={openCreate}
          />

          {/* Stat strip */}
          <div className="stat-strip">
            {[
              { label: "Total Brands", val: brands.length,  color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"/></svg> },
              { label: "Imported",     val: totalImported,  color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
              { label: "Local",        val: totalLocal,     color: "#10b981", bg: "rgba(16,185,129,0.12)",  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
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
              <input className="si" placeholder="Search brands…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="fsel" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="imported">Imported</option>
              <option value="local">Local</option>
            </select>
          </div>

          {/* Table */}
          <div className="tw">
            <table>
              <thead><tr><th>Brand</th><th>Type</th><th>Description</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div className="sk" style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0 }} /><div className="sk" style={{ height: 14, width: 130 }} /></div></td>
                      <td><div className="sk" style={{ height: 24, width: 80, borderRadius: 7 }} /></td>
                      <td><div className="sk" style={{ height: 13, width: 200 }} /></td>
                      <td><div style={{ display: "flex", gap: 6 }}><div className="sk" style={{ width: 30, height: 30, borderRadius: 7 }} /><div className="sk" style={{ width: 30, height: 30, borderRadius: 7 }} /><div className="sk" style={{ width: 30, height: 30, borderRadius: 7 }} /></div></td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4}>
                    <div className="empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72"/></svg>
                      <h3>No brands found</h3>
                      <p>{search || filterType ? "Try adjusting your filters" : "Add your first brand to get started"}</p>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map(b => {
                    const c = getColor(b.name);
                    const isImp = b.type === "imported";
                    return (
                      <tr key={b._id} onClick={() => openView(b)}>
                        <td>
                          <div className="t-nc">
                            <div className="t-av" style={{ background: c.bg, color: c.color }}>{b.name[0].toUpperCase()}</div>
                            <span className="t-bn">{b.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="tbadge" style={{ background: isImp ? "rgba(167,139,250,0.12)" : "rgba(16,185,129,0.12)", color: isImp ? "#a78bfa" : "#10b981" }}>
                            {isImp
                              ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
                              : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                            }
                            {b.type}
                          </span>
                        </td>
                        <td><span className="t-desc">{b.description || <span style={{ color: "var(--mt)", fontStyle: "italic" }}>No description</span>}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="act-btns">
                            <button className="ab v" title="View" onClick={() => openView(b)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                            <button className="ab e" title="Edit" onClick={() => openEdit(b)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                            {isAdmin && (
                              <button className="ab d" title="Delete" onClick={() => openDelete(b)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg></button>
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
        <Modal title="Add New Brand" onClose={closeModal} footer={
          <>
            <button className="mbtn cn" onClick={closeModal}>Cancel</button>
            <button className="mbtn pr" disabled={submitting} onClick={handleCreate}>{submitting ? "Creating…" : "Create Brand"}</button>
          </>
        }>
          {formBody}
        </Modal>
      )}

      {/* ── EDIT ── */}
      {modal === "edit" && (
        <Modal title="Edit Brand" onClose={closeModal} footer={
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
        <Modal title="Delete Brand" size="modal-sm" onClose={closeModal} footer={
          <>
            <button className="mbtn cn" onClick={closeModal}>Cancel</button>
            <button className="mbtn dr" disabled={submitting} onClick={handleDelete}>{submitting ? "Deleting…" : "Delete Brand"}</button>
          </>
        }>
          <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
            Are you sure you want to delete <strong style={{ color: "#f1f5f9" }}>{selected.name}</strong>?
            This will soft-delete the brand and it will no longer appear in listings.
          </p>
        </Modal>
      )}

      {/* ── VIEW ── */}
      {modal === "view" && selected && (() => {
        const c = getColor(selected.name);
        const isImp = selected.type === "imported";
        return (
          <Modal title="Brand Details" onClose={closeModal} footer={
            <>
              <button className="mbtn cn" onClick={closeModal}>Close</button>
              <button className="mbtn pr" onClick={() => { closeModal(); openEdit(selected); }}>Edit Brand</button>
            </>
          }>
            <div className="vh">
              <div className="v-av" style={{ background: c.bg, color: c.color }}>{selected.name[0].toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-.3px", marginBottom: 6 }}>{selected.name}</div>
                <span className="tbadge" style={{ background: isImp ? "rgba(167,139,250,0.12)" : "rgba(16,185,129,0.12)", color: isImp ? "#a78bfa" : "#10b981", fontSize: 11 }}>
                  {selected.type}
                </span>
              </div>
            </div>
            <div className="dg">
              <div className="di"><span className="dl">Brand ID</span><span className="dv" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#64748b" }}>{selected._id}</span></div>
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