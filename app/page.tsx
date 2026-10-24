import { Suspense } from "react";
import { loadDesk } from "@/lib/data";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/app/ui/login-form";
import { OfficeDesk } from "@/app/ui/office-desk";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <span className="text-sm font-medium">Opening law office desk…</span>
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
  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 text-slate-100">
        <main className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                />
              </svg>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-400 ring-1 ring-slate-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Office Practice Terminal
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Legal Task Desk
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Authorized access to office casework, team rosters, and task dispatch.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-2xl backdrop-blur sm:p-8">
            <LoginForm />
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            <p>Device-bound encryption • Live Supabase sync</p>
          </div>
        </main>
      </div>
    );
  }

  const desk = await loadDesk();
  if (!desk) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12 text-slate-100">
        <main className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-white">Office desk session expired</h1>
            <p className="mt-1 text-sm text-slate-400">Please re-authenticate your device.</p>
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
