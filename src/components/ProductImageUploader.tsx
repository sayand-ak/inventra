import { useRef, useState, useCallback } from "react";

/* ─── Types ──────────────────────────────────────────────── */
// ProductImageUploader.tsx
export interface ProductImage {
  url: string;
  preview?: string;
  file?: File;
  publicId?: string;
}

interface ProductImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  /** Max images allowed (default 4) */
  maxImages?: number;
}

/* ─── Default / placeholder image (inline SVG as data URI) ── */
const DEFAULT_IMG = '/default.png';

const MAX = 4;

/* ─── Component ──────────────────────────────────────────── */
export default function ProductImageUploader({
  images,
  onChange,
  maxImages = MAX,
}: ProductImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx,  setDragIdx]  = useState<number | null>(null);
  const [dropIdx,  setDropIdx]  = useState<number | null>(null);

  /* ── helpers ── */
  const canAdd = images.length < maxImages;

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = maxImages - images.length;
      const accepted  = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .slice(0, remaining)
        .map<ProductImage>((file) => ({
          url:     "",
          preview: URL.createObjectURL(file),
          file,
        }));
      if (accepted.length) onChange([...images, ...accepted]);
    },
    [images, maxImages, onChange],
  );

  const remove = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    // revoke blob URL to avoid memory leak
    const removed = images[idx];
    if (removed.preview) URL.revokeObjectURL(removed.preview);
    onChange(next);
  };

  /* ── drag-to-reorder ── */
  const onDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnter = (idx: number) => setDropIdx(idx);
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop      = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) { resetDrag(); return; }
    const next = [...images];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
    resetDrag();
  };
  const resetDrag = () => { setDragIdx(null); setDropIdx(null); };

  /* ── drop zone (file drop) ── */
  const onZoneDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const onZoneDragLeave = ()                    => setDragOver(false);
  const onZoneDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  /* ── render ── */
  const src = (img: ProductImage) => img.preview || img.url || DEFAULT_IMG;

  return (
    <div className="piu-root">
      <div className="piu-label-row">
        <span className="piu-label">Product Images</span>
        <span className="piu-count">
          {images.length} / {maxImages}
        </span>
      </div>

      <div className="piu-grid">
        {/* ── existing image slots ── */}
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`piu-slot piu-slot--filled${dragIdx === idx ? " piu-slot--dragging" : ""}${dropIdx === idx && dragIdx !== idx ? " piu-slot--drop-target" : ""}`}
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            onDragEnter={() => onDragEnter(idx)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, idx)}
            onDragEnd={resetDrag}
          >
            <img src={src(img)} alt={`Product image ${idx + 1}`} className="piu-img" />

            {/* primary badge */}
            {idx === 0 && (
              <span className="piu-primary-badge">Primary</span>
            )}

            {/* overlay actions */}
            <div className="piu-overlay">
              <div className="piu-drag-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9"  cy="5"  r="1" /><circle cx="9"  cy="12" r="1" /><circle cx="9"  cy="19" r="1" />
                  <circle cx="15" cy="5"  r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
                </svg>
                Drag to reorder
              </div>
              <button
                type="button"
                className="piu-remove-btn"
                onClick={() => remove(idx)}
                title="Remove image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* ── add slot / drop zone ── */}
        {canAdd && (
          <div
            className={`piu-slot piu-slot--add${dragOver ? " piu-slot--dragover" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={onZoneDragOver}
            onDragLeave={onZoneDragLeave}
            onDrop={onZoneDrop}
          >
            <div className="piu-add-inner">
              <div className="piu-add-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8"  y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <span className="piu-add-label">
                {dragOver ? "Drop to add" : "Add image"}
              </span>
              <span className="piu-add-hint">or drag &amp; drop</span>
            </div>
          </div>
        )}

        {/* ── empty placeholder slots (visual padding) ── */}
        {Array.from({ length: Math.max(0, (canAdd ? maxImages - 1 : maxImages) - images.length) }).map((_, i) => (
          <div key={`ph-${i}`} className="piu-slot piu-slot--placeholder" />
        ))}
      </div>

      {images.length > 1 && (
        <p className="piu-hint">Drag images to reorder · First image is the primary display image</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   READ-ONLY thumbnail strip used in the product table row
   and the view modal.
───────────────────────────────────────────────────────── */
interface ProductImageStripProps {
  images: ProductImage[];
  /** Show as a single thumbnail (table cell) vs full strip (modal) */
  variant?: "thumb" | "strip";
}

export function ProductImageStrip({ images, variant = "thumb" }: ProductImageStripProps) {
  const [active, setActive] = useState(0);

  if (variant === "thumb") {
    const img = images[0];
    return (
      <div className="pis-thumb">
        <img src={img ? (img.preview || img.url) : DEFAULT_IMG} alt="Product" />
        {images.length > 1 && <span className="pis-more">+{images.length - 1}</span>}
      </div>
    );
  }

  /* strip / gallery variant */
  return (
    <div className="pis-gallery">
      <div className="pis-main">
        <img
          src={images[active] ? (images[active].preview || images[active].url) : DEFAULT_IMG}
          alt={`Product image ${active + 1}`}
        />
      </div>
      {images.length > 1 && (
        <div className="pis-thumbs">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              className={`pis-thumb-btn${active === idx ? " pis-thumb-btn--active" : ""}`}
              onClick={() => setActive(idx)}
            >
              <img src={img.preview || img.url} alt={`Thumb ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}