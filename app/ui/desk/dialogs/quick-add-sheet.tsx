"use client";

import { memo, useState } from "react";
import type { TeamMember } from "@/lib/types";
import type { Priority } from "../types";

type QuickAddSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  members: TeamMember[];
  todayStr: string;
  tomorrowStr: string;
  onSubmit: (data: {
    title: string;
    assignedMemberId: string;
    priority: Priority;
    deadlineDate: string | null;
    clientName: string | null;
    caseTitle: string | null;
    keepOpen: boolean;
  }) => void;
  onOpenFullEditor: () => void;
  isPending: boolean;
};

export const QuickAddSheet = memo(function QuickAddSheet({
  isOpen,
  onClose,
  members,
  todayStr,
  tomorrowStr,
  onSubmit,
  onOpenFullEditor,
  isPending,
}: QuickAddSheetProps) {
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState(members[0]?.id || "");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dateOption, setDateOption] = useState<"today" | "tomorrow" | "none">("today");
  const [customDate, setCustomDate] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [clientName, setClientName] = useState("");
  const [caseTitle, setCaseTitle] = useState("");

  if (!isOpen) return null;

  const handleSave = (keepOpen: boolean) => {
    if (!title.trim() || !memberId) return;

    let deadlineDate: string | null = null;
    if (dateOption === "today") deadlineDate = todayStr;
    else if (dateOption === "tomorrow") deadlineDate = tomorrowStr;
    else if (dateOption === "none" && customDate) deadlineDate = customDate;

    onSubmit({
      title: title.trim(),
      assignedMemberId: memberId,
      priority,
      deadlineDate,
      clientName: clientName.trim() || null,
      caseTitle: caseTitle.trim() || null,
      keepOpen,
    });

    setTitle("");
    setClientName("");
    setCaseTitle("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#0F2A47]/45 backdrop-blur-sm animate-backdrop">
      <div
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5 shadow-2xl animate-bottom-sheet sm:animate-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
      >
        {/* Sheet Drag Handle for Mobile */}
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-[var(--border-strong)] sm:hidden" />

        <div className="flex items-center justify-between mb-3">
          <h3 id="quick-add-title" className="text-base font-bold text-[var(--text-primary)]">
            إضافة مهمة سريعة
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost p-1.5 rounded-lg text-xs min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* Title Input */}
        <div className="space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave(false);
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
                onClick={() => setDateOption("today")}
                className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                  dateOption === "today" ? "active" : ""
                }`}
              >
                اليوم
              </button>
              <button
                type="button"
                onClick={() => setDateOption("tomorrow")}
                className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                  dateOption === "tomorrow" ? "active" : ""
                }`}
              >
                غداً
              </button>
              <button
                type="button"
                onClick={() => setDateOption("none")}
                className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                  dateOption === "none" ? "active" : ""
                }`}
              >
                تحديد
              </button>
            </div>

            {dateOption === "none" ? (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="control text-xs py-1.5 px-2.5 w-auto min-h-[44px]"
              />
            ) : null}

            {/* Priority Selector (Legal CRM Section 6 Schema) */}
            <div className="flex items-center gap-1 bg-[var(--surface)] p-1 rounded-lg border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                  priority === "high" ? "active !bg-[var(--priority-high-bg)] !text-[var(--priority-high-text)] !border-[var(--warning-border)] font-bold" : ""
                }`}
              >
                عالية
              </button>
              <button
                type="button"
                onClick={() => setPriority("medium")}
                className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                  priority === "medium" ? "active !bg-[var(--priority-standard-bg)] !text-[var(--priority-standard-text)] !border-[var(--info-border)] font-bold" : ""
                }`}
              >
                متوسطة
              </button>
              <button
                type="button"
                onClick={() => setPriority("low")}
                className={`filter-chip min-h-[38px] text-xs px-2.5 py-1 ${
                  priority === "low" ? "active !bg-[var(--priority-low-bg)] !text-[var(--priority-low-text)] !border-[var(--neutral-status-border)] font-bold" : ""
                }`}
              >
                منخفضة
              </button>
            </div>

            {/* Assignee Dropdown */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
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
              onClick={() => setShowExtra(!showExtra)}
              className="text-xs font-semibold text-[var(--brand-primary)] hover:underline flex items-center gap-1 py-1 min-h-[36px]"
            >
              <span>{showExtra ? "− إخفاء بيانات القضية والموكل" : "+ إضافة بيانات القضية والموكل"}</span>
            </button>

            {showExtra ? (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <input
                  type="text"
                  placeholder="موضوع أو رقم القضية"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="control text-xs min-h-[44px]"
                  dir="auto"
                />
                <input
                  type="text"
                  placeholder="اسم الموكل"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="control text-xs min-h-[44px]"
                  dir="auto"
                />
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={onOpenFullEditor}
              className="btn btn-ghost text-xs px-3 min-h-[48px]"
            >
              المحرر الكامل ↗
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isPending || !title.trim()}
                className="btn btn-secondary text-xs px-3.5 min-h-[48px]"
              >
                حفظ وإضافة أخرى
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isPending || !title.trim()}
                className="btn btn-primary text-xs px-5 min-h-[48px] font-bold"
              >
                {isPending ? "جاري الحفظ…" : "حفظ المهمة"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
