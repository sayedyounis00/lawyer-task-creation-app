import type { Task } from "@/lib/types";

export type MainTab = "today" | "upcoming" | "lists" | "settings";
export type Priority = "high" | "medium" | "low";
export type SmartFilter = "all" | "pending_review" | "in_progress" | "completed" | "overdue";

export type TodayProgress = {
  incomplete: number;
  completed: number;
  total: number;
  percent: number;
};

export type MemberWorkload = {
  total: number;
  active: number;
};

export type UpcomingGroup = {
  date: string;
  display: string;
  tasks: Task[];
};
