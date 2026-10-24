"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  deleteTask,
  saveTask,
  updateTaskStatus,
} from "@/app/actions";
import type { ActionState, Session, Task, TeamMember } from "@/lib/types";

const emptyAction: ActionState = { ok: false, message: "" };

type MainTab = "today" | "upcoming" | "lists" | "settings";
type Priority = "high" | "medium" | "low";

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
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters
  const [smartFilter, setSmartFilter] = useState<string>("all");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");

  // Collapsible sections
  const [isOverdueOpen, setIsOverdueOpen] = useState(true);
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState("");
  const [quickMemberId, setQuickMemberId] = useState(members[0]?.id || "");
  const [quickPriority, setQuickPriority] = useState<Priority>("medium");
  const [quickDateOption, setQuickDateOption] = useState<"today" | "tomorrow" | "none">("today");
  const [quickCustomDate, setQuickCustomDate] = useState("");
  const [showExtraQuickFields, setShowExtraQuickFields] = useState(false);
  const [quickClientName, setQuickClientName] = useState("");
  const [quickCaseTitle, setQuickCaseTitle] = useState("");

  // Feedback toast
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Today's date string ISO YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Formatted Arabic display date (e.g. "السبت، ٢٤ أكتوبر")
  const formattedToday = useMemo(() => {
    return new Date().toLocaleDateString("ar-EG", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, []);

  // Categorize tasks
  const overdueTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "rejected" &&
        t.deadline_date &&
        t.deadline_date < todayStr
    );
  }, [tasks, todayStr]);

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "completed" || t.status === "rejected") return false;
      return t.deadline_date === todayStr || (!t.deadline_date && activeTab === "today");
    });
  }, [tasks, todayStr, activeTab]);

  const completedTodayTasks = useMemo(() => {
    return tasks.filter((t) => t.status === "completed");
  }, [tasks]);

  const upcomingTasksGrouped = useMemo(() => {
    const future = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.status !== "rejected" &&
        t.deadline_date &&
        t.deadline_date > todayStr
    );
    future.sort((a, b) => (a.deadline_date || "").localeCompare(b.deadline_date || ""));

    const groups: { date: string; display: string; tasks: Task[] }[] = [];
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
  }, [tasks, todayStr, tomorrowStr]);

  // General filtered tasks for "Lists & Smart Views" tab
  const filteredTasks = useMemo(() => {
    const selectedMember = members.find((m) => m.id === selectedMemberId);

    return tasks.filter((t) => {
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
        )
          return false;
      }

      // Member filter: match assigned_member_id OR assigned_to name
      if (selectedMemberId !== "all") {
        const matchesMember =
          (t.assigned_member_id && t.assigned_member_id === selectedMemberId) ||
          (selectedMember &&
            t.assigned_to &&
            t.assigned_to.trim().toLowerCase() === selectedMember.name.trim().toLowerCase());
        if (!matchesMember) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, smartFilter, selectedMemberId, members, todayStr]);

  // Member tasks counts (matches by assigned_member_id OR assigned_to name)
  const memberTasksCount = useMemo(() => {
    const counts = new Map<string, { total: number; active: number }>();
    for (const m of members) {
      counts.set(m.id, { total: 0, active: 0 });
    }
    for (const t of tasks) {
      const match = members.find(
        (m) =>
          (t.assigned_member_id && m.id === t.assigned_member_id) ||
          (t.assigned_to && m.name.trim().toLowerCase() === t.assigned_to.trim().toLowerCase())
      );
      if (match && counts.has(match.id)) {
        const item = counts.get(match.id)!;
        item.total += 1;
        if (t.status !== "completed" && t.status !== "rejected") {
          item.active += 1;
        }
      }
    }
    return counts;
  }, [tasks, members]);

  // Today Progress Metrics
  const todayProgress = useMemo(() => {
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

  // Open Full Drawer for New Task
  const openNewFullTask = () => {
    setEditingTask(null);
    setIsQuickAddOpen(false);
    setIsFullDrawerOpen(true);
  };

  // Open Full Drawer for Editing
  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsQuickAddOpen(false);
    setIsFullDrawerOpen(true);
  };

  // Single-tap status toggle
  const toggleComplete = async (task: Task) => {
    const nextStatus = task.status === "completed" ? "pending_review" : "completed";
    startTransition(async () => {
      const res = await updateTaskStatus(task.id, nextStatus);
      if (res.ok) {
        setToastMessage(nextStatus === "completed" ? "تم إكمال المهمة بنجاح" : "تمت إعادة المهمة للعمل النشط");
      } else {
        setToastMessage(res.message || "تعذر تحديث الحالة");
      }
    });
  };

  // Quick Add submit
  const handleQuickAdd = async (keepOpen = false) => {
    if (!quickTitle.trim()) {
      setToastMessage("يرجى كتابة عنوان المهمة");
      return;
    }
    if (!quickMemberId) {
      setToastMessage("يرجى اختيار عضو الفريق المكلف");
      return;
    }

    let deadlineDate: string | null = null;
    if (quickDateOption === "today") deadlineDate = todayStr;
    else if (quickDateOption === "tomorrow") deadlineDate = tomorrowStr;
    else if (quickDateOption === "none" && quickCustomDate) deadlineDate = quickCustomDate;

    const fd = new FormData();
    fd.append("title", quickTitle.trim());
    fd.append("assignedMemberId", quickMemberId);
    fd.append("priority", quickPriority);
    fd.append("status", "pending_review");
    if (deadlineDate) fd.append("deadlineDate", deadlineDate);
    if (quickClientName.trim()) fd.append("clientName", quickClientName.trim());
    if (quickCaseTitle.trim()) fd.append("caseTitle", quickCaseTitle.trim());

    startTransition(async () => {
      const res = await saveTask(emptyAction, fd);
      if (res.ok) {
        setToastMessage("تم حفظ المهمة بنجاح");
        setQuickTitle("");
        setQuickClientName("");
        setQuickCaseTitle("");
        if (!keepOpen) {
          setIsQuickAddOpen(false);
        }
      } else {
        setToastMessage(res.message || "تعذر حفظ المهمة");
      }
    });
  };

  // Delete task helper
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

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-4 start-4 z-50 flex items-center gap-3 rounded-xl bg-[var(--text-primary)] text-[var(--bg-main)] px-4 py-3 text-sm font-semibold shadow-2xl ring-1 ring-[var(--border-strong)] animate-backdrop"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--success)] animate-pulse" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage("")}
            className="ms-2 text-xs opacity-70 hover:opacity-100 p-1"
            aria-label="إغلاق التنبيه"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface-raised)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white shadow-sm ring-1 ring-black/10">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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
                  مزامنة نشطة
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[var(--surface)] p-1 rounded-xl border border-[var(--border-subtle)]" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "today"}
              onClick={() => setActiveTab("today")}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "today"
                  ? "bg-[var(--surface-raised)] text-[var(--brand-primary)] shadow-sm font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>اليوم</span>
              {todayProgress.incomplete > 0 && (
                <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold bg-[var(--danger)] text-white">
                  {todayProgress.incomplete}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "upcoming"}
              onClick={() => setActiveTab("upcoming")}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "upcoming"
                  ? "bg-[var(--surface-raised)] text-[var(--brand-primary)] shadow-sm font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                  ? "bg-[var(--surface-raised)] text-[var(--brand-primary)] shadow-sm font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
                  ? "bg-[var(--surface-raised)] text-[var(--brand-primary)] shadow-sm font-bold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              الإعدادات
            </button>
          </nav>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* "+ New Task" trigger on desktop */}
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="hidden sm:inline-flex btn btn-primary text-xs px-3.5 py-2 font-bold"
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
        {/* TAB 1: TODAY */}
        {activeTab === "today" && (
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
            {overdueTasks.length > 0 && (
              <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-light)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsOverdueOpen(!isOverdueOpen)}
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

                {isOverdueOpen && (
                  <div className="p-2 space-y-2 border-t border-[var(--danger-border)]">
                    {overdueTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={() => toggleComplete(task)}
                        onEdit={() => openEditTask(task)}
                        onDelete={() => handleDeleteTask(task)}
                        isOverdue
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Due Today Tasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  مهام اليوم المستحقة ({todayTasks.length})
                </h3>
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(true)}
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
                    onClick={() => setIsQuickAddOpen(true)}
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
                      onToggle={() => toggleComplete(task)}
                      onEdit={() => openEditTask(task)}
                      onDelete={() => handleDeleteTask(task)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Completed Today Section (Collapsible) */}
            {completedTodayTasks.length > 0 && (
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsCompletedOpen(!isCompletedOpen)}
                  className="w-full flex items-center justify-between p-3.5 text-start font-semibold text-[var(--text-secondary)] min-h-[48px]"
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold">المهام المكتملة ({completedTodayTasks.length})</span>
                    <span className="text-[11px] text-[var(--text-muted)] font-normal hidden sm:inline">• تُحذف تلقائياً بعد 24 ساعة من الإكمال</span>
                  </div>
                  <span className="text-xs font-semibold">{isCompletedOpen ? "إخفاء" : "عرض"}</span>
                </button>

                {isCompletedOpen && (
                  <div className="p-2 space-y-2 border-t border-[var(--border-subtle)]">
                    {completedTodayTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={() => toggleComplete(task)}
                        onEdit={() => openEditTask(task)}
                        onDelete={() => handleDeleteTask(task)}
                        isCompleted
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UPCOMING */}
        {activeTab === "upcoming" && (
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
                onClick={() => setIsQuickAddOpen(true)}
                className="btn btn-primary text-xs px-3.5 py-2 font-bold"
              >
                + جدولة مهمة
              </button>
            </div>

            {upcomingTasksGrouped.length === 0 ? (
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
                  onClick={() => setIsQuickAddOpen(true)}
                  className="mt-4 btn btn-primary text-xs px-4 py-2 font-bold inline-flex"
                >
                  + إضافة مهمة قادمة
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingTasksGrouped.map((group) => (
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
                          onToggle={() => toggleComplete(task)}
                          onEdit={() => openEditTask(task)}
                          onDelete={() => handleDeleteTask(task)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LISTS & TEAM ROSTER */}
        {activeTab === "lists" && (
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
                  onClick={openNewFullTask}
                  className="btn btn-primary text-xs px-3.5 py-2 font-bold"
                >
                  + مهمة جديدة
                </button>
              </div>
            </div>

            {/* Smart Views 4-Card Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setSmartFilter("all")}
                className={`rounded-xl p-3.5 text-start border transition-all min-h-[48px] ${
                  smartFilter === "all"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-light)] font-bold ring-1 ring-[var(--brand-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wider">كل المهام</span>
                <p className="mt-1 text-2xl font-bold">{tasks.length}</p>
              </button>

              <button
                type="button"
                onClick={() => setSmartFilter("pending_review")}
                className={`rounded-xl p-3.5 text-start border transition-all min-h-[48px] ${
                  smartFilter === "pending_review"
                    ? "border-[var(--warning)] bg-[var(--warning-light)] font-bold ring-1 ring-[var(--warning)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span className="text-xs text-[var(--warning)] font-semibold uppercase tracking-wider">قيد المراجعة</span>
                <p className="mt-1 text-2xl font-bold text-[var(--warning)]">
                  {tasks.filter((t) => t.status === "pending_review").length}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSmartFilter("in_progress")}
                className={`rounded-xl p-3.5 text-start border transition-all min-h-[48px] ${
                  smartFilter === "in_progress"
                    ? "border-[var(--brand-primary)] bg-[var(--brand-light)] font-bold ring-1 ring-[var(--brand-primary)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span className="text-xs text-[var(--brand-primary)] font-semibold uppercase tracking-wider">جاري التنفيذ</span>
                <p className="mt-1 text-2xl font-bold text-[var(--brand-primary)]">
                  {tasks.filter((t) => t.status === "in_progress").length}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSmartFilter("overdue")}
                className={`rounded-xl p-3.5 text-start border transition-all min-h-[48px] ${
                  smartFilter === "overdue"
                    ? "border-[var(--danger)] bg-[var(--danger-light)] font-bold ring-1 ring-[var(--danger)]"
                    : "border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span className="text-xs text-[var(--danger)] font-semibold uppercase tracking-wider">متأخرة</span>
                <p className="mt-1 text-2xl font-bold text-[var(--danger)]">{overdueTasks.length}</p>
              </button>
            </div>

            {/* Team Roster Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  فريق العمل بالمكتب ({members.length})
                </h3>
                {selectedMemberId !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSelectedMemberId("all")}
                    className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    إلغاء التصفية
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {members.map((member) => {
                  const counts = memberTasksCount.get(member.id) || { total: 0, active: 0 };
                  const isSelected = selectedMemberId === member.id;
                  return (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMemberId(isSelected ? "all" : member.id)}
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
              {selectedMemberId !== "all" && (
                <div className="flex items-center justify-between bg-[var(--brand-light)] p-3 rounded-xl border border-[var(--brand-primary)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--brand-primary)]">تصفية حسب العضو:</span>
                    <span className="text-sm font-bold text-[var(--text-primary)]" dir="auto">
                      {members.find((m) => m.id === selectedMemberId)?.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedMemberId("all")}
                    className="text-xs font-bold text-[var(--danger)] hover:underline px-2 py-1"
                  >
                    إلغاء التصفية ✕
                  </button>
                </div>
              )}

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
                      onToggle={() => toggleComplete(task)}
                      onEdit={() => openEditTask(task)}
                      onDelete={() => handleDeleteTask(task)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "settings" && (
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
                  <span className="text-sm font-bold text-[var(--text-primary)]" dir="auto">{session.officeName}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)]">مفتاح الجهاز</span>
                  <span className="text-xs font-mono font-bold bg-[var(--surface-raised)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md" dir="ltr">
                    {session.deviceId}
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 5-DESTINATION FIXED BOTTOM NAVIGATION BAR */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]/95 backdrop-blur bottom-nav-bar"
        role="navigation"
        aria-label="شريط التنقل السفلي"
      >
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {/* TAB 1: Today */}
          <button
            type="button"
            onClick={() => setActiveTab("today")}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors ${
              activeTab === "today"
                ? "text-[var(--brand-primary)] font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <div className="relative">
              <svg className="h-5 w-5" fill={activeTab === "today" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === "today" ? 1 : 2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {todayProgress.incomplete > 0 && (
                <span className="absolute -top-1.5 -start-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
                  {todayProgress.incomplete > 99 ? "+99" : todayProgress.incomplete}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5">اليوم</span>
          </button>

          {/* TAB 2: Upcoming */}
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors ${
              activeTab === "upcoming"
                ? "text-[var(--brand-primary)] font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <svg className="h-5 w-5" fill={activeTab === "upcoming" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === "upcoming" ? 1 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[11px] mt-0.5">القادمة</span>
          </button>

          {/* TAB 3: ADD (Center Elevated FAB) */}
          <div className="flex flex-col items-center justify-center px-2">
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="center-fab flex items-center justify-center -mt-6"
              title="إضافة مهمة جديدة"
              aria-label="إضافة مهمة جديدة"
            >
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <span className="text-[10px] font-bold text-[var(--brand-primary)] mt-1">إضافة</span>
          </div>

          {/* TAB 4: Lists & Team */}
          <button
            type="button"
            onClick={() => setActiveTab("lists")}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors ${
              activeTab === "lists"
                ? "text-[var(--brand-primary)] font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <svg className="h-5 w-5" fill={activeTab === "lists" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === "lists" ? 1 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span className="text-[11px] mt-0.5">القوائم</span>
          </button>

          {/* TAB 5: Settings */}
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors ${
              activeTab === "settings"
                ? "text-[var(--brand-primary)] font-bold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <svg className="h-5 w-5" fill={activeTab === "settings" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeTab === "settings" ? 1 : 2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[11px] mt-0.5">الإعدادات</span>
          </button>
        </div>
      </nav>

      {/* QUICK ADD BOTTOM SHEET */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-backdrop">
          <div
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5 shadow-2xl animate-bottom-sheet sm:animate-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-title"
          >
            {/* Sheet Drag Affordance */}
            <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-[var(--border-strong)] sm:hidden" />

            <div className="flex items-center justify-between mb-3">
              <h3 id="quick-add-title" className="text-base font-bold text-[var(--text-primary)]">
                إضافة مهمة سريعة
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="btn btn-ghost p-1.5 rounded-lg text-xs"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            {/* Title Input */}
            <div className="space-y-3">
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleQuickAdd(false);
                  }
                }}
                autoFocus
                placeholder="عنوان المهمة (مثال: إعداد مذكرة استئناف للدعوى ١٠٤)"
                className="control text-base font-medium min-h-[48px]"
                dir="auto"
              />

              {/* Inline Chips (Due Date, Priority, Assignee) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Due Date Chips */}
                <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setQuickDateOption("today")}
                    className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                      quickDateOption === "today" ? "active" : ""
                    }`}
                  >
                    اليوم
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDateOption("tomorrow")}
                    className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                      quickDateOption === "tomorrow" ? "active" : ""
                    }`}
                  >
                    غداً
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDateOption("none")}
                    className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                      quickDateOption === "none" ? "active" : ""
                    }`}
                  >
                    تحديد
                  </button>
                </div>

                {quickDateOption === "none" && (
                  <input
                    type="date"
                    value={quickCustomDate}
                    onChange={(e) => setQuickCustomDate(e.target.value)}
                    className="control text-xs py-1.5 px-2.5 w-auto min-h-[44px]"
                  />
                )}

                {/* Priority Selector */}
                <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setQuickPriority("high")}
                    className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                      quickPriority === "high" ? "active bg-[var(--danger)] text-white" : ""
                    }`}
                  >
                    عالية
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPriority("medium")}
                    className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                      quickPriority === "medium" ? "active bg-[var(--warning)] text-white" : ""
                    }`}
                  >
                    متوسطة
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPriority("low")}
                    className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                      quickPriority === "low" ? "active" : ""
                    }`}
                  >
                    منخفضة
                  </button>
                </div>

                {/* Assignee Dropdown */}
                <div className="flex-1 min-w-[150px]">
                  <select
                    value={quickMemberId}
                    onChange={(e) => setQuickMemberId(e.target.value)}
                    className="control text-xs min-h-[44px] py-1 px-2.5"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Extra Case/Client Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowExtraQuickFields(!showExtraQuickFields)}
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-1 py-1"
                >
                  <span>{showExtraQuickFields ? "− إخفاء بيانات القضية والموكل" : "+ إضافة بيانات القضية والموكل"}</span>
                </button>

                {showExtraQuickFields && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                    <input
                      type="text"
                      placeholder="موضوع أو رقم القضية"
                      value={quickCaseTitle}
                      onChange={(e) => setQuickCaseTitle(e.target.value)}
                      className="control text-xs min-h-[44px]"
                      dir="auto"
                    />
                    <input
                      type="text"
                      placeholder="اسم الموكل"
                      value={quickClientName}
                      onChange={(e) => setQuickClientName(e.target.value)}
                      className="control text-xs min-h-[44px]"
                      dir="auto"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={openNewFullTask}
                  className="btn btn-ghost text-xs px-3 min-h-[48px]"
                >
                  المحرر الكامل ↗
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(true)}
                    disabled={isPending}
                    className="btn btn-secondary text-xs px-3.5 min-h-[48px]"
                  >
                    حفظ وإضافة أخرى
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickAdd(false)}
                    disabled={isPending}
                    className="btn btn-primary text-xs px-5 min-h-[48px] font-bold"
                  >
                    {isPending ? "جاري الحفظ…" : "حفظ المهمة"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL TASK SLIDE-OVER DRAWER */}
      {isFullDrawerOpen && (
        <FullTaskDrawer
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
      )}
    </div>
  );
}

// ---------------------------------------------------------
// Sub-component: Task Card / Row (Touch target >= 48px)
// ---------------------------------------------------------
function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  isOverdue = false,
  isCompleted = false,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isOverdue?: boolean;
  isCompleted?: boolean;
}) {
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
      {/* Tap Checkbox / Complete Circle */}
      <button
        type="button"
        onClick={onToggle}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all min-h-[24px] min-w-[24px] ${
          isCompleted
            ? "border-[var(--success)] bg-[var(--success)] text-white"
            : "border-[var(--border-strong)] hover:border-[var(--brand-primary)] bg-transparent"
        }`}
        title={isCompleted ? "تحديد كغير مكتملة" : "تحديد كمكتملة"}
        aria-label={isCompleted ? "تحديد كغير مكتملة" : "تحديد كمكتملة"}
      >
        {isCompleted && (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
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
          {task.priority === "high" && (
            <span className="priority-high status-chip text-[10px]">أولوية عالية</span>
          )}
          {task.priority === "medium" && (
            <span className="priority-medium status-chip text-[10px]">أولوية متوسطة</span>
          )}

          {/* Status Chip / Tag */}
          {task.status === "completed" ? (
            <span className="inline-flex items-center gap-1 status-completed status-chip text-[10px] font-bold">
              <span>✓ مكتملة</span>
              <span className="opacity-80 text-[9px] font-normal" title={task.completed_at ? `تاريخ الإكمال: ${task.completed_at}` : undefined}>
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
          {task.deadline_date && (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                isOverdue ? "text-[var(--danger)] font-bold" : ""
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{task.deadline_date}</span>
              {task.deadline_time && <span>• {task.deadline_time}</span>}
            </span>
          )}

          {/* Assigned Member */}
          {task.assigned_to && (
            <span className="inline-flex items-center gap-1 rounded bg-[var(--surface)] px-1.5 py-0.5 text-[11px] font-medium" dir="auto">
              <span>👤</span>
              <span>{task.assigned_to}</span>
            </span>
          )}

          {/* Case or Client */}
          {task.case_title && (
            <span className="text-[11px] truncate max-w-[140px]" dir="auto" title={task.case_title}>
              ⚖️ {task.case_title}
            </span>
          )}
          {task.client_name && (
            <span className="text-[11px] truncate max-w-[120px]" dir="auto" title={task.client_name}>
              🏛️ {task.client_name}
            </span>
          )}
        </div>
      </div>

      {/* Row Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="btn btn-ghost p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
          className="btn btn-ghost p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)]"
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
}

// ---------------------------------------------------------
// Sub-component: Full Task Drawer (Desktop & Mobile)
// ---------------------------------------------------------
function FullTaskDrawer({
  task,
  members,
  onClose,
  onSaved,
  onDelete,
}: {
  task: Task | null;
  members: TeamMember[];
  onClose: () => void;
  onSaved: (msg: string) => void;
  onDelete: (task: Task) => void;
}) {
  const [state, formAction, isPending] = useActionState(saveTask, emptyAction);

  useEffect(() => {
    if (state.ok) {
      onSaved(state.message || "تم حفظ المهمة");
    }
  }, [state, onSaved]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-start sm:justify-start bg-black/60 backdrop-blur-sm animate-backdrop">
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
              className="btn btn-ghost p-2 rounded-lg text-sm"
              aria-label="إغلاق"
            >
              ✕
            </button>
          </div>

          <form id="full-task-form" action={formAction} className="space-y-4 pt-4">
            {task && <input type="hidden" name="id" value={task.id} />}

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
                  defaultValue={task?.deadline_time || ""}
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

            {state.message && !state.ok && (
              <div className="p-3 text-xs rounded-lg bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger-border)]">
                {state.message}
              </div>
            )}
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
