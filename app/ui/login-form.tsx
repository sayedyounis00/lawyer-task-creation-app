"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/actions";
import type { ActionState } from "@/lib/types";

const initial: ActionState = { ok: false, message: "" };

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(signIn, initial);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="deviceId">
          مفتاح تسجيل الجهاز
        </label>
        <div className="relative">
          <input
            id="deviceId"
            className="control font-mono text-sm tracking-wide bg-slate-950 border-slate-700 text-white focus:bg-slate-900 ps-10 pe-3 text-start min-h-[48px]"
            name="deviceId"
            autoComplete="username"
            required
            placeholder="LAW-XXXX-XXXX-XXXX-XXXX"
            dir="ltr"
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-400">مرتبط حصرياً بوحدة الجهاز المعتمدة لمكتبكم.</p>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5" htmlFor="password">
          كلمة مرور المدير
        </label>
        <div className="relative">
          <input
            id="password"
            className="control text-sm bg-slate-950 border-slate-700 text-white focus:bg-slate-900 ps-10 pe-3 text-start min-h-[48px]"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-slate-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      </div>

      {state.message && !state.ok ? (
        <div role="alert" className="flex items-center gap-2 p-3 text-sm rounded-lg bg-red-950/60 border border-red-800 text-red-200">
          <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{state.message}</span>
        </div>
      ) : null}

      <button
        className="btn btn-primary w-full py-3 shadow-md hover:shadow-lg transition-all min-h-[48px] text-sm font-bold"
        type="submit"
        disabled={pending}
      >
        {pending ? (
          <>
            <svg className="animate-spin -ms-1 me-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            جاري التحقق من الجهاز…
          </>
        ) : (
          <>
            <span>دخول مكتب المهام</span>
            <svg className="w-4 h-4 me-1 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
