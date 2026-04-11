/* ── useToast hook ──────────────────────────────────────── */
import { useState, useCallback } from "react";

export type ToastState = { msg: string; type: "success" | "error" } | null;

export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = useCallback((msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}