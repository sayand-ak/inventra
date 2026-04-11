import type { ReactNode } from "react";

/* ── Close icon ─────────────────────────────────────────── */
export function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ── Modal ──────────────────────────────────────────────── */
interface ModalProps {
  /** Title shown in the modal header */
  title: ReactNode;
  /** Optional subtitle line below the title */
  subtitle?: ReactNode;
  /** Extra CSS class on the inner `.modal` div, e.g. "modal-sm" | "modal-wide" */
  size?: "modal-sm" | "modal-wide" | "";
  /** Called when the overlay backdrop or the × button is clicked */
  onClose: () => void;
  /** Modal body content */
  children: ReactNode;
  /** Buttons rendered in the footer */
  footer: ReactNode;
}

export default function Modal({
  title,
  subtitle,
  size = "",
  onClose,
  children,
  footer,
}: ModalProps) {
  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal ${size}`.trim()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span className="modal-title">{title}</span>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        <div className="modal-footer">{footer}</div>
      </div>
    </div>
  );
}