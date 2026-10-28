"use client";

import { memo } from "react";
import type { Task } from "@/lib/types";
import { TaskCard } from "../components/task-card";
import type { TodayProgress } from "../types";

type TodayViewProps = {
  formattedToday: string;
  todayProgress: TodayProgress;
  overdueTasks: Task[];
  todayTasks: Task[];
  completedTodayTasks: Task[];
  isOverdueOpen: boolean;
  onToggleOverdue: () => void;
  isCompletedOpen: boolean;
  onToggleCompleted: () => void;
  onToggleTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenQuickAdd: () => void;
};

export const TodayView = memo(function TodayView({
  formattedToday,
  todayProgress,
  overdueTasks,
  todayTasks,
  completedTodayTasks,
  isOverdueOpen,
  onToggleOverdue,
  isCompletedOpen,
  onToggleCompleted,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenQuickAdd,
}: TodayViewProps) {
  return (
    <div className="space-y-6">
      {/* Today Header with Progress Ring */}
      <div className="flex items-center justify-between rounded-2xl bg-[var(--surface)] p-5 border border-[var(--border-subtle)] shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            تركيز اليوم
          </span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {formattedToday}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {todayProgress.incomplete === 0
              ? "تم إنجاز جميع مهام اليوم بالكامل!"
              : `${todayProgress.incomplete} مهام متبقية • ${todayProgress.completed} مكتملة`}
          </p>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-raised)] border-4 border-[var(--border-subtle)] shadow-inner">
          <div
            className="absolute inset-0 rounded-full border-4 border-[var(--brand-primary)] transition-all duration-500"
            style={{
              clipPath: `polygon(50% 50%, -50% -50%, ${todayProgress.percent * 2}% -50%, ${todayProgress.percent * 2}% 150%, -50% 150%)`,
            }}
          />
          <span className="text-sm font-extrabold text-[var(--text-primary)]">
            %{todayProgress.percent}
          </span>
        </div>
      </div>

      {/* Overdue Section (Collapsible) */}
      {overdueTasks.length > 0 ? (
        <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-light)] overflow-hidden">
          <button
            type="button"
            onClick={onToggleOverdue}
            className="w-full flex items-center justify-between p-3.5 text-start font-semibold text-[var(--danger)] min-h-[48px]"
          >
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-bold">مهام متأخرة تجاوزت تاريخ الاستحقاق</span>
              <span className="ms-1 rounded-full bg-[var(--danger)] text-white px-2 py-0.5 text-xs font-bold">
                {overdueTasks.length}
              </span>
            </div>
            <span className="text-xs font-bold">{isOverdueOpen ? "إخفاء" : "عرض"}</span>
          </button>

          {isOverdueOpen ? (
            <div className="p-2 space-y-2 border-t border-[var(--danger-border)]">
              {overdueTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => onToggleTask(task)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task)}
                  isOverdue
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Due Today Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            مهام اليوم المستحقة ({todayTasks.length})
          </h3>
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1 min-h-[44px] px-2"
          >
            <span>+ إضافة سريعة</span>
          </button>
        </div>

        {todayTasks.length === 0 ? (
          <div className="text-center rounded-2xl border-2 border-dashed border-[var(--border-subtle)] bg-[var(--surface)] p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand-primary)] mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-base font-bold text-[var(--text-primary)]">
              لا توجد مهام مستحقة لليوم
            </h4>
            <p className="mt-1 text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
              تم إنجاز كافة المهام أو يمكنك إضافة وتكليف مهمة جديدة فوراً.
            </p>
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="mt-4 btn btn-primary text-xs px-4 py-2 font-bold inline-flex"
            >
              + إضافة مهمة الآن
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => onToggleTask(task)}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Today Section (Collapsible) */}
      {completedTodayTasks.length > 0 ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden">
          <button
            type="button"
            onClick={onToggleCompleted}
            className="w-full flex items-center justify-between p-3.5 text-start font-semibold text-[var(--text-secondary)] min-h-[48px]"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">المهام المكتملة ({completedTodayTasks.length})</span>
              <span className="text-[11px] text-[var(--text-muted)] font-normal hidden sm:inline">
                • تُحذف تلقائياً بعد 24 ساعة من الإكمال
              </span>
            </div>
            <span className="text-xs font-semibold">{isCompletedOpen ? "إخفاء" : "عرض"}</span>
          </button>

          {isCompletedOpen ? (
            <div className="p-2 space-y-2 border-t border-[var(--border-subtle)]">
              {completedTodayTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() => onToggleTask(task)}
                  onEdit={() => onEditTask(task)}
                  onDelete={() => onDeleteTask(task)}
                  isCompleted
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
