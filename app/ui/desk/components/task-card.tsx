"use client";

import { memo, useMemo } from "react";
import type { Task } from "@/lib/types";

type TaskCardProps = {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isOverdue?: boolean;
  isCompleted?: boolean;
};

export const TaskCard = memo(function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  isOverdue = false,
  isCompleted = false,
}: TaskCardProps) {
  const statusLabel = useMemo(() => {
    switch (task.status) {
      case "pending_review":
        return "قيد المراجعة";
      case "in_progress":
        return "جاري التنفيذ";
      case "completed":
        return "مكتملة";
      case "rejected":
        return "ملغاة";
      default:
        return task.status;
    }
  }, [task.status]);

  return (
    <div
      className={`group flex items-start gap-3 rounded-xl border p-3.5 transition-all bg-[var(--surface-raised)] min-h-[56px] ${
        isCompleted
          ? "opacity-65 border-[var(--border-subtle)]"
          : isOverdue
          ? "border-[var(--danger-border)] hover:border-[var(--danger)]"
          : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:shadow-sm"
      }`}
    >
      {/* Tap Checkbox / Complete Circle with 48px touch wrapper */}
      <button
        type="button"
        onClick={onToggle}
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all min-h-[28px] min-w-[28px] ${
          isCompleted
            ? "border-[var(--success)] bg-[var(--success)] text-white"
            : "border-[var(--border-strong)] hover:border-[var(--brand-primary)] bg-transparent"
        }`}
        title={isCompleted ? "تحديد كغير مكتملة" : "تحديد كمكتملة"}
        aria-label={isCompleted ? "تحديد كغير مكتملة" : "تحديد كمكتملة"}
      >
        {isCompleted ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : null}
      </button>

      {/* Main Info */}
      <div className="flex-1 cursor-pointer min-w-0" onClick={onEdit}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`text-sm font-semibold text-[var(--text-primary)] leading-tight ${
              isCompleted ? "line-through text-[var(--text-secondary)]" : ""
            }`}
            dir="auto"
          >
            {task.title}
          </span>

          {/* Priority Flag */}
          {task.priority === "high" ? (
            <span className="priority-high status-chip text-[10px]">أولوية عالية</span>
          ) : task.priority === "medium" ? (
            <span className="priority-medium status-chip text-[10px]">أولوية متوسطة</span>
          ) : null}

          {/* Status Chip / Tag */}
          {task.status === "completed" ? (
            <span className="inline-flex items-center gap-1 status-completed status-chip text-[10px] font-bold">
              <span>✓ مكتملة</span>
              <span
                className="opacity-80 text-[9px] font-normal"
                title={task.completed_at ? `تاريخ الإكمال: ${task.completed_at}` : undefined}
              >
                • تُحذف تلقائياً خلال 24 س
              </span>
            </span>
          ) : (
            <span className={`status-${task.status} status-chip text-[10px]`}>
              {statusLabel}
            </span>
          )}
        </div>

        {/* Auxiliary Metadata Row */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
          {/* Due date */}
          {task.deadline_date ? (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                isOverdue ? "text-[var(--danger)] font-bold" : ""
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{task.deadline_date}</span>
              {task.deadline_time ? <span>• {task.deadline_time.slice(0, 5)}</span> : null}
            </span>
          ) : null}

          {/* Assigned Member */}
          {task.assigned_to ? (
            <span className="inline-flex items-center gap-1 rounded bg-[var(--surface)] px-1.5 py-0.5 text-[11px] font-medium" dir="auto">
              <span>👤</span>
              <span>{task.assigned_to}</span>
            </span>
          ) : null}

          {/* Case or Client */}
          {task.case_title ? (
            <span className="text-[11px] truncate max-w-[140px]" dir="auto" title={task.case_title}>
              ⚖️ {task.case_title}
            </span>
          ) : null}
          {task.client_name ? (
            <span className="text-[11px] truncate max-w-[120px]" dir="auto" title={task.client_name}>
              🏛️ {task.client_name}
            </span>
          ) : null}
        </div>
      </div>

      {/* Row Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="btn btn-ghost p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="تعديل تفاصيل المهمة"
          aria-label="تعديل المهمة"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="btn btn-ghost p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="حذف المهمة"
          aria-label="حذف المهمة"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});
