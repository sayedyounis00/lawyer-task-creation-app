"use client";

import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { deleteTask, saveTask, signOut, updateTaskStatus } from "@/app/actions";
import type { ActionState, Session, Task, TeamMember } from "@/lib/types";
import { BottomNav } from "./components/bottom-nav";
import { Toast } from "./components/toast";
import { QuickAddSheet } from "./dialogs/quick-add-sheet";
import type { MainTab, MemberWorkload, Priority, SmartFilter, TodayProgress, UpcomingGroup } from "./types";
import { ListsView } from "./views/lists-view";
import { SettingsView } from "./views/settings-view";
import { TodayView } from "./views/today-view";
import { UpcomingView } from "./views/upcoming-view";

const emptyAction: ActionState = { ok: false, message: "" };

// Dynamic imports for heavy dialogs to optimize initial bundle size
const TaskDrawer = dynamic(() => import("./dialogs/task-drawer"), { ssr: false });
const AddMemberDialog = dynamic(() => import("./dialogs/add-member-dialog"), { ssr: false });

export function OfficeDesk({
  session,
  tasks,
  members,
}: {
  session: Session;
  tasks: Task[];
  members: TeamMember[];
}) {
  const [isPending, startTransition] = useTransition();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<MainTab>("today");

  // Modals & Sheets
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isFullDrawerOpen, setIsFullDrawerOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [smartFilter, setSmartFilter] = useState<SmartFilter>("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");

  // Collapsible sections
  const [isOverdueOpen, setIsOverdueOpen] = useState(true);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // React 19 Optimistic UI for 0ms status toggles
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (
      current: Task[],
      update: { id: string; status: Task["status"]; completedAt: string | null }
    ) =>
      current.map((task) =>
        task.id === update.id
          ? {
              ...task,
              status: update.status,
              completed_at: update.completedAt,
              updated_at: new Date().toISOString(),
            }
          : task
      )
  );

  // Today's date string ISO YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Formatted Arabic display date
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, []);

  // Categorize tasks using optimistic state
  const overdueTasks = useMemo(() => {
    return optimisticTasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "rejected" &&
        t.deadline_date &&
        t.deadline_date < todayStr
    );
  }, [optimisticTasks, todayStr]);

  const todayTasks = useMemo(() => {
    return optimisticTasks.filter((t) => {
      if (t.status === "completed" || t.status === "rejected") return false;
      return t.deadline_date === todayStr || (!t.deadline_date && activeTab === "today");
    });
  }, [optimisticTasks, todayStr, activeTab]);

  const completedTodayTasks = useMemo(() => {
    return optimisticTasks.filter((t) => t.status === "completed");
  }, [optimisticTasks]);

  const upcomingTasksGrouped = useMemo(() => {
    const future = optimisticTasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "rejected" &&
        t.deadline_date &&
        t.deadline_date > todayStr
    );
    future.sort((a, b) => (a.deadline_date || "").localeCompare(b.deadline_date || ""));

    const groups: UpcomingGroup[] = [];
    for (const t of future) {
      const d = t.deadline_date!;
      let g = groups.find((item) => item.date === d);
      if (!g) {
        let display = d;
        if (d === tomorrowStr) {
          display = "غداً";
        } else {
          try {
            const parsed = new Date(d + "T00:00:00");
            display = parsed.toLocaleDateString("ar-EG", {
              weekday: "long",
              day: "numeric",
              month: "long",
            });
          } catch {
            display = d;
          }
        }
        g = { date: d, display, tasks: [] };
        groups.push(g);
      }
      g.tasks.push(t);
    }
    return groups;
  }, [optimisticTasks, todayStr, tomorrowStr]);

  // General filtered tasks for "Lists & Team" tab
  const filteredTasks = useMemo(() => {
    return optimisticTasks.filter((t) => {
      // Smart filter
      if (smartFilter === "pending_review" && t.status !== "pending_review") return false;
      if (smartFilter === "in_progress" && t.status !== "in_progress") return false;
      if (smartFilter === "completed" && t.status !== "completed") return false;
      if (smartFilter === "overdue") {
        if (
          t.status === "completed" ||
          t.status === "rejected" ||
          !t.deadline_date ||
          t.deadline_date >= todayStr
        ) {
          return false;
        }
      }

      // Member filter
      if (selectedMemberId !== "all") {
        const matchesMember =
          t.assigned_member_id === selectedMemberId ||
          (t.assigned_to &&
            members.find((m) => m.id === selectedMemberId)?.name === t.assigned_to);
        if (!matchesMember) return false;
      }

      return true;
    });
  }, [optimisticTasks, smartFilter, selectedMemberId, todayStr, members]);

  // Build Map for member workload lookup (O(1) lookups per Vercel js-index-maps rule)
  const memberTasksCount = useMemo(() => {
    const counts = new Map<string, MemberWorkload>();
    for (const m of members) {
      counts.set(m.id, { total: 0, active: 0 });
    }
    for (const t of optimisticTasks) {
      let mId = t.assigned_member_id;
      if (!mId && t.assigned_to) {
        const found = members.find((m) => m.name === t.assigned_to);
        if (found) mId = found.id;
      }
      if (mId && counts.has(mId)) {
        const item = counts.get(mId)!;
        item.total += 1;
        if (t.status !== "completed" && t.status !== "rejected") {
          item.active += 1;
        }
      }
    }
    return counts;
  }, [optimisticTasks, members]);

  // Today Progress Metrics
  const todayProgress: TodayProgress = useMemo(() => {
    const totalTodayIncomplete = todayTasks.length + overdueTasks.length;
    const totalTodayDone = completedTodayTasks.length;
    const totalAll = totalTodayIncomplete + totalTodayDone;
    const percent = totalAll > 0 ? Math.round((totalTodayDone / totalAll) * 100) : 0;
    return {
      incomplete: totalTodayIncomplete,
      completed: totalTodayDone,
      total: totalAll,
      percent,
    };
  }, [todayTasks, overdueTasks, completedTodayTasks]);

  // Handlers
  const openNewFullTask = () => {
    setEditingTask(null);
    setIsQuickAddOpen(false);
    setIsFullDrawerOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsQuickAddOpen(false);
    setIsFullDrawerOpen(true);
  };

  const toggleComplete = (task: Task) => {
    const nextStatus = task.status === "completed" ? "pending_review" : "completed";
    const completedAt = nextStatus === "completed" ? new Date().toISOString() : null;

    startTransition(async () => {
      setOptimisticTasks({ id: task.id, status: nextStatus, completedAt });
      const res = await updateTaskStatus(task.id, nextStatus);
      if (res.ok) {
        setToastMessage(
          nextStatus === "completed" ? "تم إكمال المهمة بنجاح" : "تمت إعادة المهمة للعمل النشط"
        );
      } else {
        setToastMessage(res.message || "تعذر تحديث الحالة");
      }
    });
  };

  const handleQuickAdd = async (data: {
    title: string;
    assignedMemberId: string;
    priority: Priority;
    deadlineDate: string | null;
    clientName: string | null;
    caseTitle: string | null;
    keepOpen: boolean;
  }) => {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("assignedMemberId", data.assignedMemberId);
    fd.append("priority", data.priority);
    fd.append("status", "pending_review");
    if (data.deadlineDate) fd.append("deadlineDate", data.deadlineDate);
    if (data.clientName) fd.append("clientName", data.clientName);
    if (data.caseTitle) fd.append("caseTitle", data.caseTitle);

    startTransition(async () => {
      const res = await saveTask(emptyAction, fd);
      if (res.ok) {
        setToastMessage("تم حفظ المهمة بنجاح");
        if (!data.keepOpen) {
          setIsQuickAddOpen(false);
        }
      } else {
        setToastMessage(res.message || "تعذر حفظ المهمة");
      }
    });
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`هل أنت متأكد من حذف المهمة "${task.title}"؟`)) return;
    const fd = new FormData();
    fd.append("id", task.id);
    startTransition(async () => {
      const res = await deleteTask(fd);
      if (res.ok) {
        setToastMessage("تم حذف المهمة");
        if (editingTask?.id === task.id) {
          setIsFullDrawerOpen(false);
          setEditingTask(null);
        }
      } else {
        setToastMessage(res.message || "تعذر حذف المهمة");
      }
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Toast Feedback Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage("")} />

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm ring-1 ring-black/10">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight sm:text-lg" dir="auto">
                  {session.officeName.startsWith("الاستاذ") || session.officeName.startsWith("الأستاذ")
                    ? session.officeName
                    : `الاستاذ: ${session.officeName}`}
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-md bg-[var(--success-light)] px-2 py-0.5 text-xs font-semibold text-[var(--success)] border border-[var(--success-border)]">
                  <span className="ms-1.5 h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                  متصل
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav
            className="hidden md:flex items-center gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border-subtle)]"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "today"}
              onClick={() => setActiveTab("today")}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "today"
                  ? "bg-[var(--brand-primary)] text-white shadow-sm font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              <span>اليوم</span>
              {todayProgress.incomplete > 0 ? (
                <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold bg-[var(--danger)] text-white">
                  {todayProgress.incomplete}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "upcoming"}
              onClick={() => setActiveTab("upcoming")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "upcoming"
                  ? "bg-[var(--brand-primary)] text-white shadow-sm font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              القادمة
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "lists"}
              onClick={() => setActiveTab("lists")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "lists"
                  ? "bg-[var(--brand-primary)] text-white shadow-sm font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              القوائم وفريق العمل
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "settings"
                  ? "bg-[var(--brand-primary)] text-white shadow-sm font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
              }`}
            >
              الإعدادات
            </button>
          </nav>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="hidden sm:inline-flex btn btn-primary text-xs px-3.5 py-2 font-bold min-h-[44px]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>إضافة سريعة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 pb-28 md:pb-16">
        {activeTab === "today" ? (
          <TodayView
            formattedToday={formattedToday}
            todayProgress={todayProgress}
            overdueTasks={overdueTasks}
            todayTasks={todayTasks}
            completedTodayTasks={completedTodayTasks}
            isOverdueOpen={isOverdueOpen}
            onToggleOverdue={() => setIsOverdueOpen(!isOverdueOpen)}
            isCompletedOpen={isCompletedOpen}
            onToggleCompleted={() => setIsCompletedOpen(!isCompletedOpen)}
            onToggleTask={toggleComplete}
            onEditTask={openEditTask}
            onDeleteTask={handleDeleteTask}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          />
        ) : activeTab === "upcoming" ? (
          <UpcomingView
            upcomingGroups={upcomingTasksGrouped}
            onToggleTask={toggleComplete}
            onEditTask={openEditTask}
            onDeleteTask={handleDeleteTask}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          />
        ) : activeTab === "lists" ? (
          <ListsView
            tasks={optimisticTasks}
            members={members}
            filteredTasks={filteredTasks}
            smartFilter={smartFilter}
            onSelectSmartFilter={setSmartFilter}
            selectedMemberId={selectedMemberId}
            onSelectMember={setSelectedMemberId}
            memberTasksCount={memberTasksCount}
            overdueCount={overdueTasks.length}
            onToggleTask={toggleComplete}
            onEditTask={openEditTask}
            onDeleteTask={handleDeleteTask}
            onOpenNewTask={openNewFullTask}
            onOpenAddMember={() => setIsAddMemberOpen(true)}
          />
        ) : (
          <SettingsView session={session} onSignOut={handleSignOut} isPending={isPending} />
        )}
      </main>

      {/* Fixed 5-Destination Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        todayProgress={todayProgress}
      />

      {/* Quick Add Sheet */}
      <QuickAddSheet
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        members={members}
        todayStr={todayStr}
        tomorrowStr={tomorrowStr}
        onSubmit={handleQuickAdd}
        onOpenFullEditor={openNewFullTask}
        isPending={isPending}
      />

      {/* Dynamically Loaded Full Task Slide-Over Drawer */}
      {isFullDrawerOpen ? (
        <TaskDrawer
          isOpen={isFullDrawerOpen}
          task={editingTask}
          members={members}
          onClose={() => {
            setIsFullDrawerOpen(false);
            setEditingTask(null);
          }}
          onSaved={(msg) => {
            setToastMessage(msg);
            setIsFullDrawerOpen(false);
            setEditingTask(null);
          }}
          onDelete={handleDeleteTask}
        />
      ) : null}

      {/* Dynamically Loaded Add Member Dialog */}
      {isAddMemberOpen ? (
        <AddMemberDialog
          isOpen={isAddMemberOpen}
          onClose={() => setIsAddMemberOpen(false)}
          onSaved={(msg) => {
            setToastMessage(msg);
            setIsAddMemberOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
