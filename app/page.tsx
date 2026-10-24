import { Suspense } from "react";
import { loadDesk } from "@/lib/data";
import { clearSession, getSession } from "@/lib/session";
import { checkDeviceSubscription } from "@/lib/subscription";
import { LoginForm } from "@/app/ui/login-form";
import { OfficeDesk } from "@/app/ui/office-desk";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-primary)]">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)] border-t-transparent" />
            <span className="text-sm font-semibold">جاري فتح مكتب المحاماة…</span>
          </div>
        </div>
      }
    >
      <Home />
    </Suspense>
  );
}

async function Home() {
  const session = await getSession();
  let subscriptionInactiveMessage: string | null = null;

  if (session) {
    const sub = await checkDeviceSubscription(session.deviceId);
    if (!sub.isActive) {
      await clearSession();
      subscriptionInactiveMessage =
        sub.message || "اشتراك هذا الجهاز غير سارٍ أو منتهي الصلاحية. يرجى سداد الاشتراك لتسجيل الدخول.";
    }
  }

  if (!session || subscriptionInactiveMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
        <main className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 ring-1 ring-slate-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              منصة إدارة العمل القانوني
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              مكتب مهام المحاماة
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              تسجيل الدخول المصرح به لإدارة القضايا، توزيع المهام، ومتابعة فريق العمل.
            </p>
          </div>

          {subscriptionInactiveMessage && (
            <div
              role="alert"
              className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/60 p-4 text-red-200 backdrop-blur shadow-lg"
            >
              <div className="flex items-start gap-3">
                <svg className="h-6 w-6 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm">
                  <p className="font-bold text-red-300">تنبيه الاشتراك</p>
                  <p className="mt-1 leading-relaxed text-red-200/90">{subscriptionInactiveMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur sm:p-8">
            <LoginForm />
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            <p>مشفر ومرتبط بالجهاز المعتمد • مزامنة فورية عبر Supabase</p>
          </div>
        </main>
      </div>
    );
  }

  const desk = await loadDesk();
  if (!desk) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
        <main className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-white">انتهت جلسة الجهاز المصرح به</h1>
            <p className="mt-1 text-sm text-slate-400">يرجى إعادة تسجيل الدخول للجهاز مرة أخرى.</p>
          </div>
          <LoginForm />
        </main>
      </div>
    );
  }

  return (
    <OfficeDesk
      session={desk.session}
      tasks={desk.tasks}
      members={desk.members}
    />
  );
}
