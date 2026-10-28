"use client";

import { memo } from "react";
import type { MainTab, TodayProgress } from "../types";

type BottomNavProps = {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenQuickAdd: () => void;
  todayProgress: TodayProgress;
};

export const BottomNav = memo(function BottomNav({
  activeTab,
  onTabChange,
  onOpenQuickAdd,
  todayProgress,
}: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border-subtle)] bg-[var(--surface-raised)]/95 backdrop-blur bottom-nav-bar"
      role="navigation"
      aria-label="شريط التنقل السفلي"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {/* TAB 1: Today */}
        <button
          type="button"
          onClick={() => onTabChange("today")}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors ${
            activeTab === "today"
              ? "text-[var(--brand-primary)] font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <div className="relative">
            <svg
              className="h-5 w-5"
              fill={activeTab === "today" ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={activeTab === "today" ? 1 : 2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            {todayProgress.incomplete > 0 ? (
              <span className="absolute -top-1.5 -start-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
                {todayProgress.incomplete > 99 ? "+99" : todayProgress.incomplete}
              </span>
            ) : null}
          </div>
          <span className="text-[11px] mt-0.5">اليوم</span>
        </button>

        {/* TAB 2: Upcoming */}
        <button
          type="button"
          onClick={() => onTabChange("upcoming")}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors ${
            activeTab === "upcoming"
              ? "text-[var(--brand-primary)] font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <svg
            className="h-5 w-5"
            fill={activeTab === "upcoming" ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={activeTab === "upcoming" ? 1 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-[11px] mt-0.5">القادمة</span>
        </button>

        {/* TAB 3: ADD (Center Elevated FAB) */}
        <div className="flex flex-col items-center justify-center px-2">
          <button
            type="button"
            onClick={onOpenQuickAdd}
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
          onClick={() => onTabChange("lists")}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors ${
            activeTab === "lists"
              ? "text-[var(--brand-primary)] font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <svg
            className="h-5 w-5"
            fill={activeTab === "lists" ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={activeTab === "lists" ? 1 : 2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-[11px] mt-0.5">القوائم</span>
        </button>

        {/* TAB 5: Settings */}
        <button
          type="button"
          onClick={() => onTabChange("settings")}
          className={`flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] transition-colors ${
            activeTab === "settings"
              ? "text-[var(--brand-primary)] font-bold"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <svg
            className="h-5 w-5"
            fill={activeTab === "settings" ? "currentColor" : "none"}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={activeTab === "settings" ? 1 : 2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[11px] mt-0.5">الإعدادات</span>
        </button>
      </div>
    </nav>
  );
});
