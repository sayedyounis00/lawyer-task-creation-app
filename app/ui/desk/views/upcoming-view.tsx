"use client";

import { memo } from "react";
import type { Task } from "@/lib/types";
import { TaskCard } from "../components/task-card";
import type { UpcomingGroup } from "../types";

type UpcomingViewProps = {
  upcomingGroups: UpcomingGroup[];
  onToggleTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenQuickAdd: () => void;
};

export const UpcomingView = memo(function UpcomingView({
  upcomingGroups,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenQuickAdd,
}: UpcomingViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            العمل المجدول
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            الجدول الزمني القادم
          </h2>
        </div>
        <button
          type="button"
          onClick={onOpenQuickAdd}
          className="btn btn-primary text-xs px-3.5 py-2 font-bold min-h-[44px]"
        >
          + جدولة مهمة
        </button>
      </div>

      {upcomingGroups.length === 0 ? (
        <div className="text-center rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--surface)] p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] mb-3">
            <svg className="h-6 w-6 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-[var(--text-primary)]">
            لا توجد مهام قادمة مجدولة
          </h4>
          <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            المهام المستقبلية المحددة بتواريخ استحقاق قادمة ستظهر هنا مقسمة حسب الأيام.
          </p>
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="mt-4 btn btn-primary text-xs px-4 py-2 font-bold inline-flex"
          >
            + إضافة مهمة قادمة
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingGroups.map((group) => (
            <div key={group.date} className="space-y-2">
              <div className="sticky top-14 z-10 flex items-center justify-between bg-[var(--bg-main)]/95 backdrop-blur py-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                  {group.display}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {group.tasks.length} {group.tasks.length > 2 ? "مهام" : "مهمة"}
                </span>
              </div>

              <div className="space-y-2">
                {group.tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => onToggleTask(task)}
                    onEdit={() => onEditTask(task)}
                    onDelete={() => onDeleteTask(task)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
