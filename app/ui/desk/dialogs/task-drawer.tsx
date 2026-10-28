"use client";

import { useActionState, useEffect } from "react";
import { saveTask } from "@/app/actions";
import type { ActionState, Task, TeamMember } from "@/lib/types";

const emptyAction: ActionState = { ok: false, message: "" };

type TaskDrawerProps = {
  isOpen: boolean;
  task: Task | null;
  members: TeamMember[];
  onClose: () => void;
  onSaved: (msg: string) => void;
  onDelete: (task: Task) => void;
};

export default function TaskDrawer({
  isOpen,
  task,
  members,
  onClose,
  onSaved,
  onDelete,
}: TaskDrawerProps) {
  const [state, formAction, isPending] = useActionState(saveTask, emptyAction);

  useEffect(() => {
    if (state.ok) {
      onSaved(state.message || "تم حفظ المهمة");
    }
  }, [state, onSaved]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start bg-[#0F2A47]/45 backdrop-blur-sm animate-backdrop">
      <div
        className="h-full w-full max-w-lg bg-[var(--surface-raised)] border-e border-[var(--border-subtle)] p-6 shadow-2xl flex flex-col justify-between overflow-y-auto desk-scroll animate-drawer"
        role="dialog"
        aria-modal="true"
      >
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              {task ? "تعديل بيانات المهمة" : "إنشاء مهمة جديدة"}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost p-2 rounded-lg text-sm min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>

          <form id="full-task-form" action={formAction} className="space-y-4 pt-4">
            {task ? <input type="hidden" name="id" value={task.id} /> : null}

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                عنوان المهمة *
              </label>
              <input
                type="text"
                name="title"
                defaultValue={task?.title || ""}
                required
                placeholder="إعداد مذكرة دفاع أو طعن..."
                className="control text-sm font-semibold min-h-[48px]"
                dir="auto"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                عضو الفريق المكلف *
              </label>
              <select
                name="assignedMemberId"
                defaultValue={task?.assigned_member_id || members[0]?.id || ""}
                required
                className="control text-sm min-h-[48px]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  الحالة
                </label>
                <select
                  name="status"
                  defaultValue={task?.status || "pending_review"}
                  className="control text-sm min-h-[48px]"
                >
                  <option value="pending_review">قيد المراجعة</option>
                  <option value="in_progress">جاري التنفيذ</option>
                  <option value="completed">مكتملة</option>
                  <option value="rejected">ملغاة / مرفوضة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  الأولوية
                </label>
                <select
                  name="priority"
                  defaultValue={task?.priority || "medium"}
                  className="control text-sm min-h-[48px]"
                >
                  <option value="high">أولوية عالية</option>
                  <option value="medium">أولوية متوسطة</option>
                  <option value="low">أولوية منخفضة</option>
                </select>
              </div>
            </div>

            {/* Deadline Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  تاريخ الاستحقاق
                </label>
                <input
                  type="date"
                  name="deadlineDate"
                  defaultValue={task?.deadline_date || ""}
                  className="control text-sm min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  وقت الاستحقاق
                </label>
                <input
                  type="time"
                  name="deadlineTime"
                  defaultValue={task?.deadline_time ? task.deadline_time.slice(0, 5) : ""}
                  className="control text-sm min-h-[48px]"
                />
              </div>
            </div>

            {/* Case Title & Client Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  موضوع أو رقم القضية
                </label>
                <input
                  type="text"
                  name="caseTitle"
                  defaultValue={task?.case_title || ""}
                  placeholder="رقم الدعوى أو عنوان القضية"
                  className="control text-sm min-h-[48px]"
                  dir="auto"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                  اسم الموكل
                </label>
                <input
                  type="text"
                  name="clientName"
                  defaultValue={task?.client_name || ""}
                  placeholder="اسم الموكل أو الشركة"
                  className="control text-sm min-h-[48px]"
                  dir="auto"
                />
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                الوصف وتوجيهات العمل
              </label>
              <textarea
                name="description"
                rows={4}
                defaultValue={task?.description || ""}
                placeholder="اكتب التوجيهات القانونية، الملاحظات والمستندات المطلوبة..."
                className="control text-sm py-2"
                dir="auto"
              />
            </div>

            {state.message && !state.ok ? (
              <div className="p-3 text-xs rounded-lg bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]">
                {state.message}
              </div>
            ) : null}
          </form>
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3 mt-6">
          {task ? (
            <button
              type="button"
              onClick={() => onDelete(task)}
              className="btn btn-danger text-xs px-3 min-h-[48px]"
            >
              حذف المهمة
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary text-xs px-4 min-h-[48px]"
            >
              إلغاء
            </button>
            <button
              type="submit"
              form="full-task-form"
              disabled={isPending}
              className="btn btn-primary text-xs px-6 font-bold min-h-[48px]"
            >
              {isPending ? "جاري الحفظ…" : task ? "تحديث المهمة" : "إنشاء المهمة"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
