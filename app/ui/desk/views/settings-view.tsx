"use client";

import { memo } from "react";
import type { Session } from "@/lib/types";

type SettingsViewProps = {
  session: Session;
  onSignOut: () => void;
  isPending: boolean;
};

export const SettingsView = memo(function SettingsView({
  session,
  onSignOut,
  isPending,
}: SettingsViewProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
          التفضيلات والجهاز
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          إعدادات وحدة المكتب
        </h2>
      </div>

      {/* Office Terminal Info */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          اعتماد وربط الجهاز
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)]">
            <span className="text-sm font-medium text-[var(--text-secondary)]">المدير الأستاذ:</span>
            <span className="text-sm font-bold text-[var(--text-primary)]" dir="auto">
              {session.officeName}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">مفتاح الجهاز</span>
            <span
              className="text-xs font-mono font-bold bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md"
              dir="ltr"
            >
              {session.deviceId}
            </span>
          </div>
        </div>
      </div>

      {/* System & Data Policies */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
          سياسة حفظ وتطهير البيانات
        </h3>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
          تُحفظ جميع المهام وبيانات أعضاء الفريق مباشرة في النظام. المهام المكتملة
          يتم تطهيرها وأرشفتها تلقائياً بعد مرور 24 ساعة لضمان خفة وسرعة الأداء.
        </p>
      </div>

      {/* Sign Out Card */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">إنهاء الجلسة</h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            تسجيل الخروج من هذا الجهاز وإغلاق وحدة التحكم
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          disabled={isPending}
          className="btn btn-danger text-xs px-4 py-2 font-bold min-h-[44px]"
        >
          {isPending ? "جاري الخروج…" : "تسجيل الخروج"}
        </button>
      </div>
    </div>
  );
});
