"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMember,
  deleteTask,
  saveTask,
  signOut,
  updateTaskStatus,
} from "@/app/actions";
import type { ActionState, Session, Task, TeamMember } from "@/lib/types";

const emptyAction: ActionState = { ok: false, message: "" };

type Tab = "tasks" | "team";
type SortOption = "deadline" | "priority" | "newest";

export function OfficeDesk({
  session,
  tasks,
  members,
}: {
  session: Session;
  tasks: Task[];
  members: TeamMember[];
}) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("deadline");
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Compute office metrics
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pending_review").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const today = new Date().toISOString().slice(0, 10);
    const overdue = tasks.filter(
      (t) => t.status !== "completed" && t.deadline_date && t.deadline_date < today
    ).length;
    return { total, pending, inProgress, completed, overdue };
  }, [tasks]);

  const memberMap = useMemo(() => {
    return new Map(members.map((m) => [m.id, m]));
  }, [members]);

  const memberTasksCount = useMemo(() => {
    const counts = new Map<string, { total: number; active: number }>();
    for (const m of members) {
      counts.set(m.id, { total: 0, active: 0 });
    }
    for (const t of tasks) {
      if (t.assigned_member_id && counts.has(t.assigned_member_id)) {
        const item = counts.get(t.assigned_member_id)!;
        item.total += 1;
        if (t.status !== "completed" && t.status !== "rejected") {
          item.active += 1;
        }
      }
    }
    return counts;
  }, [tasks, members]);

  const openNewTaskDrawer = () => {
    setEditingTask(null);
    setIsTaskDrawerOpen(true);
  };

  const openEditTaskDrawer = (task: Task) => {
    setEditingTask(task);
    setIsTaskDrawerOpen(true);
  };

  const filterByMember = (memberId: string) => {
    setTab("tasks");
    setMemberFilter(memberId);
    setStatusFilter("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-12">
      {/* Toast feedback notification */}
      {toastMessage ? (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl ring-1 ring-slate-800 animate-backdrop">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Modern Executive Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm ring-1 ring-blue-700/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                  {session.officeName}
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono" dir="auto">
                Device {session.deviceId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {tab === "tasks" ? (
              <button
                type="button"
                onClick={openNewTaskDrawer}
                className="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Task</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsMemberDrawerOpen(true)}
                className="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span>Add Member</span>
              </button>
            )}

            <form action={signOut}>
              <button
                type="submit"
                className="btn btn-ghost text-xs sm:text-sm px-2.5 sm:px-3 text-slate-600 hover:text-slate-900"
                title="Sign out of device"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* KPI Stats Strip */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <button
              type="button"
              onClick={() => {
                setTab("tasks");
                setStatusFilter("all");
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                statusFilter === "all" && tab === "tasks"
                  ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tasks</span>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{stats.total}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("tasks");
                setStatusFilter("in_progress");
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                statusFilter === "in_progress" && tab === "tasks"
                  ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">In Progress</span>
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight text-indigo-900">{stats.inProgress}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("tasks");
                setStatusFilter("pending_review");
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                statusFilter === "pending_review" && tab === "tasks"
                  ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending</span>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight text-amber-900">{stats.pending}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("tasks");
                setStatusFilter("completed");
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                statusFilter === "completed" && tab === "tasks"
                  ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-900">{stats.completed}</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("tasks");
                setStatusFilter("all");
                setSortBy("deadline");
              }}
              className="col-span-2 sm:col-span-1 rounded-xl border border-red-200 bg-red-50/40 p-3 text-left hover:bg-red-50 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">Overdue</span>
                {stats.overdue > 0 ? (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
                    Action
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-2xl font-bold tracking-tight text-red-700">{stats.overdue}</p>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Tab Switcher (Desktop and Tablet) */}
        <div className="hidden sm:flex items-center justify-between mb-6">
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "tasks"}
              onClick={() => setTab("tasks")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                tab === "tasks"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Tasks & Assignments</span>
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {tasks.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={tab === "team"}
              onClick={() => setTab("team")}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                tab === "team"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Team Roster & Workload</span>
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {members.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Panes */}
        {tab === "tasks" ? (
          <TasksWorkspace
            tasks={tasks}
            members={members}
            memberMap={memberMap}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            memberFilter={memberFilter}
            setMemberFilter={setMemberFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onOpenNew={openNewTaskDrawer}
            onOpenEdit={openEditTaskDrawer}
            onOpenMemberTab={() => setTab("team")}
            onToast={setToastMessage}
          />
        ) : (
          <TeamWorkspace
            members={members}
            memberTasksCount={memberTasksCount}
            onOpenAddMember={() => setIsMemberDrawerOpen(true)}
            onFilterMemberTasks={filterByMember}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (48px+ touch targets) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur shadow-lg">
        <div className="flex items-center justify-around">
          <button
            type="button"
            onClick={() => setTab("tasks")}
            className={`flex flex-col items-center justify-center min-w-[70px] min-h-[48px] py-1 text-xs font-semibold ${
              tab === "tasks" ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Tasks</span>
          </button>

          {/* Quick Create Floating Button */}
          <button
            type="button"
            onClick={openNewTaskDrawer}
            className="flex items-center justify-center h-12 w-12 -mt-4 rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white active:scale-95 transition-transform"
            aria-label="Create new task"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setTab("team")}
            className={`flex flex-col items-center justify-center min-w-[70px] min-h-[48px] py-1 text-xs font-semibold ${
              tab === "team" ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>Team ({members.length})</span>
          </button>
        </div>
      </nav>

      {/* Task Drawer / Bottom Sheet */}
      {isTaskDrawerOpen ? (
        <TaskDrawer
          editingTask={editingTask}
          members={members}
          onClose={() => {
            setIsTaskDrawerOpen(false);
            setEditingTask(null);
          }}
          onToast={setToastMessage}
          onOpenMemberTab={() => {
            setIsTaskDrawerOpen(false);
            setTab("team");
          }}
        />
      ) : null}

      {/* Member Drawer / Bottom Sheet */}
      {isMemberDrawerOpen ? (
        <MemberDrawer
          onClose={() => setIsMemberDrawerOpen(false)}
          onToast={setToastMessage}
        />
      ) : null}
    </div>
  );
}

/* =========================================================================
   TASKS WORKSPACE
   ========================================================================= */

function TasksWorkspace({
  tasks,
  members,
  memberMap,
  statusFilter,
  setStatusFilter,
  memberFilter,
  setMemberFilter,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onOpenNew,
  onOpenEdit,
  onOpenMemberTab,
  onToast,
}: {
  tasks: Task[];
  members: TeamMember[];
  memberMap: Map<string, TeamMember>;
  statusFilter: string;
  setStatusFilter: (st: string) => void;
  memberFilter: string;
  setMemberFilter: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: SortOption;
  setSortBy: (s: SortOption) => void;
  onOpenNew: () => void;
  onOpenEdit: (task: Task) => void;
  onOpenMemberTab: () => void;
  onToast: (msg: string) => void;
}) {
  // Filter tasks
  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (memberFilter !== "all" && t.assigned_member_id !== memberFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCase = t.case_title?.toLowerCase().includes(q) ?? false;
        const matchesClient = t.client_name?.toLowerCase().includes(q) ?? false;
        const matchesDesc = t.description?.toLowerCase().includes(q) ?? false;
        const assignee = memberMap.get(t.assigned_member_id ?? "")?.name.toLowerCase() ?? "";
        const matchesAssignee = assignee.includes(q);
        if (!matchesTitle && !matchesCase && !matchesClient && !matchesDesc && !matchesAssignee) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "deadline") {
        if (!a.deadline_date) return 1;
        if (!b.deadline_date) return -1;
        return a.deadline_date.localeCompare(b.deadline_date);
      }
      if (sortBy === "priority") {
        const priorityWeight: Record<string, number> = { high: 1, medium: 2, low: 3 };
        return (priorityWeight[a.priority] ?? 2) - (priorityWeight[b.priority] ?? 2);
      }
      // Newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [tasks, statusFilter, memberFilter, searchQuery, sortBy, memberMap]);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="search"
              placeholder="Search by title, case number, client, or assignee…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="control pl-10 text-sm bg-slate-50 border-slate-200 focus:bg-white"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>

          {/* Assignee & Sort dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {members.length > 0 ? (
              <select
                className="control w-auto text-xs font-medium py-2 px-3 border-slate-200 bg-slate-50"
                value={memberFilter}
                onChange={(e) => setMemberFilter(e.target.value)}
                aria-label="Filter by assigned member"
              >
                <option value="all">All Assignees</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.role_name ? `(${m.role_name})` : ""}
                  </option>
                ))}
              </select>
            ) : null}

            <select
              className="control w-auto text-xs font-medium py-2 px-3 border-slate-200 bg-slate-50"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort tasks by"
            >
              <option value="deadline">Sort: Deadline</option>
              <option value="priority">Sort: Priority</option>
              <option value="newest">Sort: Newest</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">Status:</span>
          {(
            [
              { id: "all", label: "All Tasks", count: tasks.length },
              { id: "pending_review", label: "Pending", count: tasks.filter((t) => t.status === "pending_review").length },
              { id: "in_progress", label: "In Progress", count: tasks.filter((t) => t.status === "in_progress").length },
              { id: "completed", label: "Completed", count: tasks.filter((t) => t.status === "completed").length },
              { id: "rejected", label: "Rejected", count: tasks.filter((t) => t.status === "rejected").length },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`filter-chip ${statusFilter === item.id ? "active" : ""}`}
            >
              <span>{item.label}</span>
              <span className={`text-[11px] rounded-full px-1.5 py-0.2 ${
                statusFilter === item.id ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"
              }`}>
                {item.count}
              </span>
            </button>
          ))}

          {(statusFilter !== "all" || memberFilter !== "all" || searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setMemberFilter("all");
                setSearchQuery("");
              }}
              className="text-xs text-blue-600 font-semibold hover:underline ml-auto pl-2"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Roster requirement notice if empty */}
      {members.length === 0 ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Team Roster Required</h3>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Before tasks can be dispatched and recorded, register at least one attorney, paralegal, or staff member in your office roster.
              </p>
              <button
                type="button"
                onClick={onOpenMemberTab}
                className="mt-3 btn btn-primary text-xs py-2 px-3 shadow-none bg-amber-700 hover:bg-amber-800"
              >
                Go to Team Roster & Add Member →
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Tasks List Feed */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">No tasks created yet</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Dispatch casework, defense briefs, or office tasks to team members. Rows persist instantly to Supabase.
          </p>
          <button
            type="button"
            onClick={onOpenNew}
            disabled={members.length === 0}
            className="mt-4 btn btn-primary text-sm px-4 py-2"
          >
            + Create First Task
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-600">No tasks match your active filters or search criteria.</p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setMemberFilter("all");
              setSearchQuery("");
            }}
            className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assignee={memberMap.get(task.assigned_member_id ?? "")}
              onEdit={() => onOpenEdit(task)}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   TASK CARD WITH QUICK-TRIAGE ACTIONS
   ========================================================================= */

function TaskCard({
  task,
  assignee,
  onEdit,
  onToast,
}: {
  task: Task;
  assignee?: TeamMember;
  onEdit: () => void;
  onToast: (msg: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(task.status);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const dueInfo = useMemo(() => {
    if (!task.deadline_date) return null;
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const isPast = task.deadline_date < todayStr && currentStatus !== "completed";
    const isToday = task.deadline_date === todayStr;

    return {
      isPast,
      isToday,
      text: `${task.deadline_date}${task.deadline_time ? ` @ ${task.deadline_time}` : ""}`,
    };
  }, [task.deadline_date, task.deadline_time, currentStatus]);

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus);
    startTransition(async () => {
      const res = await updateTaskStatus(task.id, newStatus);
      if (res.ok) {
        onToast(`Task status changed to ${labelStatus(newStatus)}`);
        router.refresh();
      } else {
        onToast(`Error updating status: ${res.message}`);
        setCurrentStatus(task.status);
      }
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const form = new FormData();
    form.append("id", task.id);
    const res = await deleteTask(form);
    if (res.ok) {
      onToast("Task deleted.");
      router.refresh();
    } else {
      onToast(`Failed to delete: ${res.message}`);
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          {/* Card Meta Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Indicator */}
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${
                task.priority === "high"
                  ? "priority-high"
                  : task.priority === "low"
                  ? "priority-low"
                  : "priority-medium"
              }`}
            >
              {task.priority === "high" && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
              )}
              {task.priority}
            </span>

            {/* Quick Status Dropdown */}
            <div className="relative inline-block">
              <select
                value={currentStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isPending}
                aria-label={`Change status for ${task.title}`}
                className={`status-chip cursor-pointer pr-6 appearance-none font-bold text-xs ${
                  currentStatus === "pending_review"
                    ? "status-pending_review"
                    : currentStatus === "in_progress"
                    ? "status-in_progress"
                    : currentStatus === "completed"
                    ? "status-completed"
                    : "status-rejected"
                }`}
              >
                <option value="pending_review">Pending Review</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-current opacity-70">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Overdue / Due alert */}
            {dueInfo?.isPast ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800">
                <svg className="h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Overdue ({dueInfo.text})
              </span>
            ) : dueInfo?.isToday ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Due Today
              </span>
            ) : dueInfo?.text ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {dueInfo.text}
              </span>
            ) : null}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-slate-900 leading-snug break-words" dir="auto">
            {task.title}
          </h3>

          {/* Assignee & Case & Client Meta */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {/* Assignee with Avatar */}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-1 pr-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white uppercase">
                {(assignee?.name || task.assigned_to || "A").slice(0, 1)}
              </span>
              <span className="font-semibold text-slate-800" dir="auto">
                {assignee?.name || task.assigned_to || "Unassigned"}
              </span>
              {assignee?.role_name ? (
                <span className="text-slate-400 text-[10px]">({assignee.role_name})</span>
              ) : null}
            </div>

            {task.case_title ? (
              <div className="inline-flex items-center gap-1 font-medium text-slate-700" dir="auto">
                <span className="font-semibold text-slate-400">Case:</span>
                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{task.case_title}</span>
              </div>
            ) : null}

            {task.client_name ? (
              <div className="inline-flex items-center gap-1 font-medium text-slate-700" dir="auto">
                <span className="font-semibold text-slate-400">Client:</span>
                <span dir="auto">{task.client_name}</span>
              </div>
            ) : null}
          </div>

          {/* Description preview */}
          {task.description ? (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1" dir="auto">
              {task.description}
            </p>
          ) : null}
        </div>

        {/* Card Actions */}
        <div className="flex items-center sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <button
            type="button"
            onClick={onEdit}
            className="btn btn-secondary flex-1 sm:w-full text-xs min-h-[36px] py-1.5 px-3"
          >
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span>Edit</span>
          </button>

          {showConfirmDelete ? (
            <div className="flex items-center gap-1 flex-1 sm:w-full">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn btn-danger flex-1 text-xs min-h-[36px] py-1.5 px-2 bg-red-600 text-white hover:bg-red-700 border-none"
              >
                {isDeleting ? "…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="btn btn-secondary text-xs min-h-[36px] py-1.5 px-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="btn btn-ghost text-xs min-h-[36px] py-1.5 px-2.5 text-slate-400 hover:text-red-600"
              title="Delete task"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   TEAM WORKSPACE & WORKLOAD INTELLIGENCE
   ========================================================================= */

function TeamWorkspace({
  members,
  memberTasksCount,
  onOpenAddMember,
  onFilterMemberTasks,
}: {
  members: TeamMember[];
  memberTasksCount: Map<string, { total: number; active: number }>;
  onOpenAddMember: () => void;
  onFilterMemberTasks: (id: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        (m.role_name && m.role_name.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [members, search]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Office Team Roster ({members.length})
          </h2>
          <p className="text-xs text-slate-500">
            Attorneys and staff registered to this hardware terminal with active case assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Search by name, role, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="control text-xs max-w-xs py-2 px-3 border-slate-200 bg-slate-50"
          />
          <button
            type="button"
            onClick={onOpenAddMember}
            className="btn btn-primary text-xs sm:text-sm px-3 sm:px-4 py-2 shrink-0"
          >
            + Add Member
          </button>
        </div>
      </div>

      {/* Team Roster Grid */}
      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">No team members registered</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            Add attorneys, legal assistants, or administrative personnel to enable assignment dispatching.
          </p>
          <button
            type="button"
            onClick={onOpenAddMember}
            className="mt-4 btn btn-primary text-sm px-4 py-2"
          >
            + Add First Member
          </button>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-600">No team members match &ldquo;{search}&rdquo;.</p>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMembers.map((member) => {
            const counts = memberTasksCount.get(member.id) ?? { total: 0, active: 0 };
            return (
              <div
                key={member.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Member Identity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white shadow-sm">
                        {member.name.slice(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900" dir="auto">
                          {member.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">@{member.username}</p>
                      </div>
                    </div>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10">
                      {member.role_name || "Member"}
                    </span>
                  </div>

                  {/* Position & Department */}
                  {(member.position || member.department) && (
                    <div className="flex flex-wrap gap-1 text-xs text-slate-600">
                      {member.position && (
                        <span className="rounded bg-slate-100 px-2 py-0.5" dir="auto">
                          {member.position}
                        </span>
                      )}
                      {member.department && (
                        <span className="rounded bg-slate-100 px-2 py-0.5" dir="auto">
                          {member.department}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Contact Badges */}
                  <div className="space-y-1 pt-1 text-xs text-slate-600">
                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-1.5 hover:text-blue-600 truncate"
                        title={member.email}
                      >
                        <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{member.email}</span>
                      </a>
                    ) : null}
                    {member.phone ? (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-1.5 hover:text-blue-600"
                      >
                        <svg className="h-3.5 w-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{member.phone}</span>
                      </a>
                    ) : null}
                  </div>
                </div>

                {/* Workload Status & Filter Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-slate-900">{counts.active}</span> active{" "}
                    <span className="text-slate-400">({counts.total} total)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onFilterMemberTasks(member.id)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>View Tasks</span>
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   TASK SLIDE-OVER DRAWER / MOBILE BOTTOM SHEET
   ========================================================================= */

function TaskDrawer({
  editingTask,
  members,
  onClose,
  onToast,
  onOpenMemberTab,
}: {
  editingTask: Task | null;
  members: TeamMember[];
  onClose: () => void;
  onToast: (msg: string) => void;
  onOpenMemberTab: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveTask, emptyAction);

  useEffect(() => {
    if (!state.ok) return;
    onToast(editingTask ? "Task updated." : "Task created.");
    onClose();
    router.refresh();
  }, [state.ok, state.message, editingTask, onClose, onToast, router]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-drawer sm:rounded-l-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sm:rounded-tl-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <h2 className="text-base font-bold text-slate-900">
                {editingTask ? "Edit Casework Task" : "Dispatch New Task"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              aria-label="Close dialog"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form Body */}
          <form action={action} className="flex-1 overflow-y-auto p-6 space-y-4 desk-scroll">
            <input type="hidden" name="id" value={editingTask?.id ?? ""} />

            {members.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                <p className="font-bold">Team roster is empty</p>
                <p className="mt-1">Tasks must be assigned to an authorized office team member.</p>
                <button
                  type="button"
                  onClick={onOpenMemberTab}
                  className="mt-2 text-blue-700 font-bold hover:underline"
                >
                  Add team member now →
                </button>
              </div>
            ) : null}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Task Title *
              </label>
              <input
                key={editingTask?.id ?? "new-title"}
                className="control"
                name="title"
                required
                placeholder="e.g. Prepare reply brief for defense"
                defaultValue={editingTask?.title ?? ""}
                dir="auto"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Assign to Team Member *
              </label>
              <select
                key={`${editingTask?.id ?? "new"}-assignee`}
                className="control"
                name="assignedMemberId"
                required
                disabled={members.length === 0}
                defaultValue={editingTask?.assigned_member_id ?? ""}
              >
                <option value="" disabled>
                  {members.length === 0 ? "No team members available" : "Select team member *"}
                </option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} {member.role_name ? `(${member.role_name})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Status
                </label>
                <select
                  key={`${editingTask?.id ?? "new"}-status`}
                  className="control"
                  name="status"
                  defaultValue={editingTask?.status ?? "pending_review"}
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  key={`${editingTask?.id ?? "new"}-priority`}
                  className="control"
                  name="priority"
                  defaultValue={editingTask?.priority ?? "medium"}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Urgent)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Deadline Date
                </label>
                <input
                  key={`${editingTask?.id ?? "new"}-date`}
                  className="control text-xs"
                  name="deadlineDate"
                  type="date"
                  defaultValue={editingTask?.deadline_date ?? ""}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Deadline Time
                </label>
                <input
                  key={`${editingTask?.id ?? "new"}-time`}
                  className="control text-xs"
                  name="deadlineTime"
                  type="time"
                  defaultValue={editingTask?.deadline_time ?? ""}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Case Title / Number
              </label>
              <input
                key={`${editingTask?.id ?? "new"}-case`}
                className="control"
                name="caseTitle"
                placeholder="e.g. Case #2026-CV-8841"
                defaultValue={editingTask?.case_title ?? ""}
                dir="auto"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Client Name
              </label>
              <input
                key={`${editingTask?.id ?? "new"}-client`}
                className="control"
                name="clientName"
                placeholder="e.g. Apex Corporation Ltd."
                defaultValue={editingTask?.client_name ?? ""}
                dir="auto"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Notes & Instructions
              </label>
              <textarea
                key={`${editingTask?.id ?? "new"}-notes`}
                className="control min-h-[90px] text-xs leading-relaxed"
                name="description"
                placeholder="Include specific deliverables, hearing dates, or filing requirements…"
                defaultValue={editingTask?.description ?? ""}
                dir="auto"
              />
            </div>

            {state.message && !state.ok ? (
              <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-600">
                {state.message}
              </p>
            ) : null}

            {/* Sticky form footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || members.length === 0}
                className="btn btn-primary text-xs px-5 py-2 shadow-sm"
              >
                {pending ? "Saving…" : editingTask ? "Save Changes" : "Dispatch Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   MEMBER SLIDE-OVER DRAWER / MOBILE BOTTOM SHEET
   ========================================================================= */

function MemberDrawer({
  onClose,
  onToast,
}: {
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addMember, emptyAction);

  useEffect(() => {
    if (!state.ok) return;
    onToast("Team member added.");
    onClose();
    router.refresh();
  }, [state.ok, state.message, onClose, onToast, router]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex sm:pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-drawer sm:rounded-l-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sm:rounded-tl-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
              <h2 className="text-base font-bold text-slate-900">Add Team Member</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              aria-label="Close dialog"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form action={action} className="flex-1 overflow-y-auto p-6 space-y-4 desk-scroll">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                className="control"
                name="name"
                required
                placeholder="e.g. Sarah Jenkins, Esq."
                dir="auto"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Username Key *
              </label>
              <input
                className="control font-mono text-xs"
                name="username"
                required
                placeholder="sjenkins"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Role / Title
              </label>
              <input
                className="control"
                name="roleName"
                placeholder="Associate Counsel / Senior Partner"
                dir="auto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Department
                </label>
                <input
                  className="control"
                  name="department"
                  placeholder="Litigation"
                  dir="auto"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Position
                </label>
                <input
                  className="control"
                  name="position"
                  placeholder="Senior Counsel"
                  dir="auto"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  className="control text-xs"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 0192"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Email
                </label>
                <input
                  className="control text-xs"
                  name="email"
                  type="email"
                  placeholder="attorney@office.com"
                />
              </div>
            </div>

            {state.message && !state.ok ? (
              <p className="rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-600">
                {state.message}
              </p>
            ) : null}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="btn btn-primary text-xs px-5 py-2 shadow-sm"
              >
                {pending ? "Adding…" : "Register Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function labelStatus(status: string) {
  if (status === "pending_review") return "Pending Review";
  if (status === "in_progress") return "In Progress";
  if (status === "completed") return "Completed";
  if (status === "rejected") return "Rejected";
  return status;
}
