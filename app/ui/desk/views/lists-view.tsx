"use client";

import { memo } from "react";
import type { Task, TeamMember } from "@/lib/types";
import { TaskCard } from "../components/task-card";
import type { MemberWorkload, SmartFilter } from "../types";

type ListsViewProps = {
  tasks: Task[];
  members: TeamMember[];
  filteredTasks: Task[];
  smartFilter: SmartFilter;
  onSelectSmartFilter: (filter: SmartFilter) => void;
  selectedMemberId: string;
  onSelectMember: (memberId: string) => void;
  memberTasksCount: Map<string, MemberWorkload>;
  overdueCount: number;
  onToggleTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onOpenNewTask: () => void;
  onOpenAddMember: () => void;
};

export const ListsView = memo(function ListsView({
  tasks,
  members,
  filteredTasks,
  smartFilter,
  onSelectSmartFilter,
  selectedMemberId,
  onSelectMember,
  memberTasksCount,
  overdueCount,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onOpenNewTask,
  onOpenAddMember,
}: ListsViewProps) {
  const pendingCount = tasks.filter((t) => t.status === "pending_review").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
            التنظيم والتكليف
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            القوائم وفريق العمل
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddMember}
            className="btn btn-secondary text-xs px-3.5 py-2 font-bold min-h-[44px]"
          >
            + إضافة عضو فريق
          </button>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="btn btn-primary text-xs px-3.5 py-2 font-bold min-h-[44px]"
          >
            + مهمة جديدة
          </button>
        </div>
      </div>

      {/* Smart Views 4-Card Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => onSelectSmartFilter("all")}
          className={`rounded-xl p-3.5 text-start border transition-all min-h-[48px] ${
            smartFilter === "all"
              ? "border-[var(--brand-primary)] bg-[var(--brand-light)] font-bold ring-1 ring-[var(--brand-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
          }`}
        >
          <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
            كل المهام
          </span>
          <p className="mt-1 text-2xl font-bold">{tasks.length}</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectSmartFilter("pending_review")}
          className={`rounded-xl p-3.5 text-start border transition-all min-h-[48px] ${
            smartFilter === "pending_review"
              ? "border-[var(--warning)] bg-[var(--warning-light)] font-bold ring-1 ring-[var(--warning)]"
              : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
          }`}
        >
          <span className="text-xs text-[var(--warning)] font-semibold uppercase tracking-wider">
            قيد المراجعة
          </span>
          <p className="mt-1 text-2xl font-bold text-[var(--warning)]">{pendingCount}</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectSmartFilter("in_progress")}
          className={`rounded-xl p-3.5 text-start border transition-all min-h-[48px] ${
            smartFilter === "in_progress"
              ? "border-[var(--brand-primary)] bg-[var(--brand-light)] font-bold ring-1 ring-[var(--brand-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
          }`}
        >
          <span className="text-xs text-[var(--brand-primary)] font-semibold uppercase tracking-wider">
            جاري التنفيذ
          </span>
          <p className="mt-1 text-2xl font-bold text-[var(--brand-primary)]">{inProgressCount}</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectSmartFilter("overdue")}
          className={`rounded-xl p-3.5 text-start border transition-all min-h-[48px] ${
            smartFilter === "overdue"
              ? "border-[var(--danger)] bg-[var(--danger-light)] font-bold ring-1 ring-[var(--danger)]"
              : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
          }`}
        >
          <span className="text-xs text-[var(--danger)] font-semibold uppercase tracking-wider">
            متأخرة
          </span>
          <p className="mt-1 text-2xl font-bold text-[var(--danger)]">{overdueCount}</p>
        </button>
      </div>

      {/* Team Roster Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            فريق العمل بالمكتب ({members.length})
          </h3>
          {selectedMemberId !== "all" ? (
            <button
              type="button"
              onClick={() => onSelectMember("all")}
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline min-h-[36px] px-2 flex items-center"
            >
              إلغاء التصفية
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {members.map((member) => {
            const counts = memberTasksCount.get(member.id) || { total: 0, active: 0 };
            const isSelected = selectedMemberId === member.id;
            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(isSelected ? "all" : member.id)}
                className={`cursor-pointer rounded-xl border p-4 transition-all min-h-[48px] ${
                  isSelected
                    ? "border-[var(--brand-primary)] bg-[var(--brand-light)] ring-2 ring-[var(--brand-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)]" dir="auto">
                      {member.name}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {member.role_name} {member.department ? `• ${member.department}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-2 py-0.5 text-xs font-bold text-[var(--text-primary)]">
                    {counts.active} نشطة
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span dir="ltr">@{member.username}</span>
                  <span>{counts.total} مهام إجمالية</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtered Tasks Section */}
      <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
        {selectedMemberId !== "all" && selectedMember ? (
          <div className="flex items-center justify-between bg-[var(--brand-light)] p-3 rounded-xl border border-[var(--brand-primary)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--brand-primary)]">تصفية حسب العضو:</span>
              <span className="text-sm font-bold text-[var(--text-primary)]" dir="auto">
                {selectedMember.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectMember("all")}
              className="text-xs font-bold text-[var(--danger)] hover:underline px-2 py-1 min-h-[36px] flex items-center"
            >
              إلغاء التصفية ✕
            </button>
          </div>
        ) : null}

        {/* Task list matching current filters */}
        <div className="space-y-2 pt-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-8">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                لا توجد مهام تطابق معايير التصفية والبحث المحددة.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={() => onToggleTask(task)}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});
