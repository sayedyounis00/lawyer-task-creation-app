"use client";

import { memo } from "react";

type ToastProps = {
  message: string;
  onClose: () => void;
};

export const Toast = memo(function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed top-4 start-4 z-50 flex items-center gap-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] px-4 py-3 text-sm font-semibold shadow-2xl ring-1 ring-[var(--border-strong)] animate-backdrop"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)] animate-pulse" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ms-2 text-xs opacity-70 hover:opacity-100 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
        aria-label="إغلاق التنبيه"
      >
        ✕
      </button>
    </div>
  );
});
