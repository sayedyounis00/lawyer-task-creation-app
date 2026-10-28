"use client";

import { useActionState, useEffect } from "react";
import { addMember } from "@/app/actions";
import type { ActionState } from "@/lib/types";

const emptyAction: ActionState = { ok: false, message: "" };

type AddMemberDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (msg: string) => void;
};

export default function AddMemberDialog({ isOpen, onClose, onSaved }: AddMemberDialogProps) {
  const [state, formAction, isPending] = useActionState(addMember, emptyAction);

  useEffect(() => {
    if (state.ok) {
      onSaved(state.message || "تمت إضافة عضو الفريق بنجاح");
    }
  }, [state, onSaved]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A47]/45 backdrop-blur-sm animate-backdrop">
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-6 shadow-2xl animate-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-member-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <h3 id="add-member-title" className="text-lg font-bold text-[var(--text-primary)]">
            إضافة عضو فريق جديد
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost p-1.5 rounded-lg text-xs min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="space-y-3 pt-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              الاسم الكامل *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="مثال: أ. أحمد مصطفى"
              className="control text-sm font-semibold min-h-[48px]"
              dir="auto"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
              اسم المستخدم (للتكليف والإسناد) *
            </label>
            <input
              type="text"
              name="username"
              required
              placeholder="مثال: ahmed_mostafa"
              className="control text-sm font-semibold min-h-[48px]"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                المسمى الوظيفي
              </label>
              <input
                type="text"
                name="roleName"
                defaultValue="محامي متدرب"
                placeholder="محامي استئناف، مستشار..."
                className="control text-sm min-h-[48px]"
                dir="auto"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                القسم
              </label>
              <input
                type="text"
                name="department"
                placeholder="المدني، التجاري..."
                className="control text-sm min-h-[48px]"
                dir="auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                رقم الهاتف
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="010..."
                className="control text-sm min-h-[48px]"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                name="email"
                placeholder="member@law.com"
                className="control text-sm min-h-[48px]"
                dir="ltr"
              />
            </div>
          </div>

          {state.message && !state.ok ? (
            <div className="p-3 text-xs rounded-lg bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]">
              {state.message}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)] mt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs px-4 min-h-[48px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary text-xs px-6 font-bold min-h-[48px]"
            >
              {isPending ? "جاري الإضافة…" : "إضافة العضو"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
