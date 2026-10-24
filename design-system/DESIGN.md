# Todo List App: System Design

**Version:** 1.0
**Status:** Draft
**Platforms:** iOS and Android (cross-platform), optional web later

---

## 1. Overview

A fast, offline-first todo list app with a **bottom navigation bar** for one-thumb navigation. Users capture tasks quickly, organize them into lists, see what matters today, and get reminded at the right time. Data syncs across devices when the user signs in, and the app works fully without an account.

### 1.1 Goals

- Capture a task in under 3 seconds from app launch.
- Work fully offline; sync in the background when online.
- Navigate every primary area from the bottom nav with one thumb.
- Reliable reminders (local notifications, no server dependency).
- Accessible (screen readers, large text, sufficient contrast, dark mode).

### 1.2 Non-Goals (v1)

- Real-time collaboration or shared lists.
- Rich-text notes, file attachments, or subtasks deeper than one level.
- AI task suggestions.

### 1.3 Success Metrics

| Metric | Target |
|---|---|
| Cold start to interactive | < 1.5 s on mid-range device |
| Task creation time (tap to saved) | < 3 s |
| Crash-free sessions | > 99.5% |
| Sync conflict rate | < 0.5% of syncs |
| 7-day retention | > 35% |

---

## 2. Requirements

### 2.1 Functional Requirements

**Tasks**
- FR-1: Create, edit, delete, and restore tasks (soft delete with 30-day trash).
- FR-2: Task fields: title (required), notes, due date/time, priority (none/low/medium/high), list, tags, completion state.
- FR-3: Mark complete/incomplete with a single tap; completed tasks move to a completed section.
- FR-4: One level of subtasks (checklist items).
- FR-5: Recurring tasks (daily, weekly, monthly, custom).
- FR-6: Reminders (at due time, or offset before due time).

**Organization**
- FR-7: Custom lists with name, color, and icon.
- FR-8: Smart views: Today, Upcoming, Overdue, Completed.
- FR-9: Search by title, notes, and tag.
- FR-10: Filter and sort (due date, priority, created date, manual order).
- FR-11: Drag to reorder within a list.

**Account and Sync**
- FR-12: Optional sign-up with email/password or OAuth (Google, Apple).
- FR-13: Background sync across devices; local data migrates to the account on first sign-in.
- FR-14: Export data (JSON/CSV) and delete account.

**Settings**
- FR-15: Theme (light/dark/system), default list, default reminder offset, week start day, notification toggle.

### 2.2 Non-Functional Requirements

- **Performance:** 60 fps scrolling with 5,000 tasks; list queries under 50 ms.
- **Availability:** Core features independent of network; backend target 99.9%.
- **Security:** TLS 1.2+ in transit, encrypted storage for tokens, per-user data isolation.
- **Privacy:** No third-party ad trackers; analytics are anonymous and opt-out.
- **Accessibility:** WCAG 2.2 AA; minimum touch target 48x48 dp.
- **Localization:** i18n-ready strings, RTL support.

---

## 3. Information Architecture and Navigation

### 3.1 Bottom Navigation Bar

Five destinations, always visible on top-level screens, hidden on modal and detail screens.

| Position | Tab | Icon | Purpose |
|---|---|---|---|
| 1 | **Today** | sun / calendar-day | Tasks due today plus overdue |
| 2 | **Upcoming** | calendar | Tasks grouped by upcoming date |
| 3 | **Add** (center) | plus in circle | Opens quick-add sheet (action, not a screen) |
| 4 | **Lists** | list / folder | All lists and smart views |
| 5 | **Settings** | gear / person | Account, preferences, data |

**Behavior rules**
- Active tab uses filled icon + accent color + label; inactive uses outline icon + muted color.
- Labels always shown (not icon-only) for clarity and accessibility.
- Tapping the active tab scrolls to top; tapping again pops to the tab's root.
- Each tab keeps its own navigation stack and scroll position (state preserved on switch).
- The center **Add** button does not navigate; it opens a bottom sheet over the current screen.
- Badge on **Today** shows the count of overdue + due-today incomplete tasks (capped at 99+).
- Bar hides on scroll-down in long lists only if the user enables "auto-hide" (off by default).
- Respect safe-area insets (home indicator / gesture bar).

### 3.2 Screen Map

```
App
├── Onboarding (first launch only, 3 skippable cards)
├── Auth (optional): Sign in / Sign up / Reset password
└── Main (bottom nav)
    ├── Today
    │   └── Task Detail (push)
    ├── Upcoming
    │   └── Task Detail (push)
    ├── [Add] -> Quick Add Sheet (modal)
    │       └── Full Editor (expand)
    ├── Lists
    │   ├── Smart Views: All, Overdue, Completed, Trash
    │   ├── List Detail (push)
    │   │   └── Task Detail (push)
    │   ├── Create/Edit List (modal)
    │   └── Search (push)
    └── Settings
        ├── Account / Sync
        ├── Notifications
        ├── Appearance
        ├── Data (export, delete)
        └── About
```

---

## 4. UI/UX Specification

### 4.1 Screens

**Today**
- Header: date ("Saturday, Oct 24") and progress ring (completed / total for today).
- Sections: Overdue (red accent, collapsible), Today, Completed today (collapsed by default).
- Row: checkbox, title, due time, list color dot, priority flag.
- Swipe right: complete. Swipe left: delete (with undo snackbar).
- Empty state: illustration + "Nothing due today. Enjoy it, or add a task."

**Upcoming**
- Grouped by day: Tomorrow, then weekday names, then dates; week strip at top for jumping.
- Same row component and gestures as Today.

**Quick Add Sheet**
- Opens with the keyboard up and the title field focused.
- Inline chips under the field: Due date, Priority, List, Reminder. Each opens a compact picker.
- Natural-language hints: "Call mom tomorrow 6pm" pre-fills the due chip (parsed locally).
- Buttons: "Add" (primary), "Add another" (keeps sheet open), expand icon to the full editor.
- Dismiss by swipe down; an unsaved non-empty draft prompts for confirmation.

**Lists**
- Top: search bar. Smart views as a 2x2 grid with counts. Below: user lists (color, icon, open count).
- Long-press a list to rename, recolor, reorder, or delete. FAB-less: creating a list uses a "New list" row at the bottom.

**List Detail**
- Title, color accent, sort/filter menu, task rows, inline "Add task" row at the bottom.
- Drag handle on long-press to reorder.

**Task Detail**
- Editable title, notes, due date/time, repeat, reminder, priority, list, tags, subtasks, created/updated metadata.
- Auto-saves on change (debounced 400 ms); no explicit Save button.
- Overflow menu: duplicate, move, delete.

**Settings**
- Grouped list rows. Account row shows sync status ("Synced 2 min ago" / "Offline, 3 changes pending").

### 4.2 Design Tokens

| Token | Light | Dark |
|---|---|---|
| Background | #FFFFFF | #0F1115 |
| Surface | #F5F6F8 | #1A1D23 |
| Primary (accent) | #4F46E5 | #818CF8 |
| Text primary | #111827 | #F3F4F6 |
| Text secondary | #6B7280 | #9CA3AF |
| Danger / overdue | #DC2626 | #F87171 |
| Success | #16A34A | #4ADE80 |

- Typography: system font; sizes 12 / 14 / 16 / 20 / 28; scales with OS text size.
- Spacing scale: 4, 8, 12, 16, 24, 32.
- Corner radius: 8 (rows/chips), 16 (sheets), 999 (pills).
- Bottom bar height: 64 dp plus inset; center Add button 56 dp, elevated.

### 4.3 Interaction and Feedback

- Complete animation: checkbox fill + strike-through, row collapses after 300 ms.
- Haptic: light impact on complete, medium on delete.
- Undo snackbar for 5 seconds on delete and complete.
- Skeleton loaders only on first sync; local data renders instantly.

### 4.4 Accessibility

- Every interactive element has a role, label, and state (e.g., "Buy milk, due today, not completed").
- Custom actions on rows for screen readers (complete, delete, edit) as alternatives to swipe.
- Contrast ratio at least 4.5:1 for text; do not rely on color alone for overdue (also use an icon and text).
- Respect "reduce motion".

---

## 5. System Architecture

### 5.1 High-Level Diagram

```
┌─────────────────────────────── Mobile Client ───────────────────────────────┐
│  UI Layer (screens, bottom nav, components)                                  │
│        │                                                                     │
│  State Layer (store + selectors)                                             │
│        │                                                                     │
│  Domain Layer (use cases: CreateTask, CompleteTask, ScheduleReminder, ...)   │
│        │                                                                     │
│  Data Layer ── Repository ──┬── Local DB (SQLite)  <── source of truth       │
│                             ├── Sync Engine (outbox queue)                   │
│                             └── Notification Scheduler (local)               │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTPS (REST + JSON)
                              ┌────────▼────────┐
                              │   API Gateway   │  auth, rate limit
                              └────────┬────────┘
                    ┌──────────────────┼───────────────────┐
              ┌─────▼─────┐      ┌─────▼─────┐       ┌─────▼──────┐
              │ Auth Svc  │      │ Sync/Task │       │ Push Svc   │
              │           │      │ Service   │       │ (optional) │
              └─────┬─────┘      └─────┬─────┘       └────────────┘
                    └────────┬─────────┘
                       ┌─────▼─────┐
                       │ PostgreSQL│
                       └───────────┘
```

### 5.2 Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Client framework | React Native (Expo) + TypeScript | One codebase, fast iteration, strong ecosystem |
| Navigation | React Navigation (bottom-tabs + native-stack) | First-class bottom tab support and per-tab stacks |
| State | Zustand + selectors | Small, simple, testable |
| Local DB | SQLite (expo-sqlite) with a lightweight query layer | Reliable, queryable, offline-first |
| Notifications | Local scheduled notifications | Works offline, no server needed |
| Backend | Node.js (TypeScript) REST API, or a BaaS like Supabase | Fast to build; swap-able behind the repository interface |
| Database | PostgreSQL | Relational model, row-level security |
| Auth | JWT access + refresh tokens; OAuth providers | Standard, stateless |
| Hosting | Managed container platform or serverless | Low ops overhead |
| Observability | Crash reporting + structured logs + metrics | Detect regressions quickly |

> Flutter is an equally valid alternative; the architecture below is framework-agnostic.

### 5.3 Client Architecture (Layers)

- **UI:** dumb components that receive data and callbacks; no business logic.
- **State:** screens subscribe to derived selectors (e.g., `selectTodayTasks`).
- **Domain:** pure functions and use cases; unit-testable with no framework.
- **Data:** repositories expose `Task`, `List`, and `Tag` operations; hide whether data comes from SQLite or network.

Suggested folder structure:

```
src/
├── app/                 # providers, navigation root
├── navigation/          # BottomTabs, stacks, route types
├── features/
│   ├── today/
│   ├── upcoming/
│   ├── lists/
│   ├── tasks/           # editor, detail, quick-add
│   └── settings/
├── domain/              # models, use cases, recurrence, NL date parser
├── data/
│   ├── db/              # schema, migrations, DAOs
│   ├── repositories/
│   ├── sync/            # outbox, pull/push, conflict resolution
│   └── notifications/
├── components/          # TaskRow, Chip, Sheet, EmptyState, ...
├── theme/               # tokens, dark/light
└── utils/
```

---

## 6. Data Model

### 6.1 Entities

**User** (server only)
- `id` (uuid), `email`, `created_at`

**List**
- `id` (uuid), `user_id`, `name`, `color`, `icon`, `position` (float), `created_at`, `updated_at`, `deleted_at`

**Task**
- `id` (uuid), `user_id`, `list_id` (nullable = Inbox), `title`, `notes`
- `due_at` (timestamp, nullable), `due_has_time` (bool), `priority` (0-3)
- `completed_at` (nullable), `position` (float)
- `recurrence_rule` (RRULE string, nullable), `recurrence_parent_id` (nullable)
- `created_at`, `updated_at`, `deleted_at`

**Subtask**
- `id`, `task_id`, `title`, `completed_at`, `position`, `updated_at`, `deleted_at`

**Tag** / **TaskTag**
- `Tag(id, user_id, name, color)`; `TaskTag(task_id, tag_id)`

**Reminder**
- `id`, `task_id`, `remind_at`, `offset_minutes`, `notification_id` (local), `updated_at`

**Outbox** (client only)
- `id`, `entity`, `entity_id`, `op` (create/update/delete), `payload`, `created_at`, `attempts`

### 6.2 Local SQLite Schema (excerpt)

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  list_id TEXT REFERENCES lists(id),
  title TEXT NOT NULL,
  notes TEXT,
  due_at INTEGER,
  due_has_time INTEGER NOT NULL DEFAULT 0,
  priority INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  position REAL NOT NULL,
  recurrence_rule TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  dirty INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_tasks_due      ON tasks(due_at)        WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_list     ON tasks(list_id, position) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_complete ON tasks(completed_at);
```

### 6.3 Server Schema Notes

- Same tables as above, plus `user_id` on every row.
- Row-level security: `user_id = auth.uid()`.
- `updated_at` maintained by trigger; `server_version` (bigint, monotonically increasing per user) used as the sync cursor.

### 6.4 Key Queries

| View | Predicate |
|---|---|
| Today | `deleted_at IS NULL AND completed_at IS NULL AND due_at < end_of_today` (overdue + today) |
| Upcoming | `due_at >= start_of_tomorrow`, grouped by day |
| Overdue | `due_at < now AND completed_at IS NULL` |
| Completed | `completed_at IS NOT NULL` ordered by `completed_at DESC` |
| Trash | `deleted_at IS NOT NULL AND deleted_at > now - 30d` |

---

## 7. Sync Design

### 7.1 Approach

Offline-first with an **outbox pattern**. The local database is the source of truth for the UI. Writes go to SQLite and the outbox in a single transaction; the sync engine uploads asynchronously.

### 7.2 Flow

1. **Write path:** UI action -> use case -> SQLite write + outbox row -> UI updates immediately.
2. **Push:** when online, send outbox items in order, in batches (max 100). On success, delete the outbox rows. On failure, retry with exponential backoff (1s, 2s, 4s ... max 5 min).
3. **Pull:** request `GET /sync?since=<cursor>`; apply changes in a transaction; store the new cursor.
4. **Triggers:** app foreground, network regained, after a local write (debounced 2 s), and periodic background fetch (about every 15 min where the OS allows).

### 7.3 Conflict Resolution

- **Default:** last-write-wins per entity using `updated_at` (server clock authoritative on receipt).
- **Field-level merge** for tasks: if two devices edited different fields, merge them. The same field resolves by latest timestamp.
- **Delete vs. edit:** delete wins unless the edit is newer than the delete (then restore).
- **Ordering:** `position` is a fractional index (midpoint between neighbors); rebalance when the gap drops below 1e-6.

### 7.4 Idempotency

- Client-generated UUIDs for all entities.
- Each push request carries an `Idempotency-Key`; the server de-duplicates retries.

### 7.5 First Sign-In Migration

On first sign-in, all local rows are marked dirty and pushed to the account. If the account already has data, merge by UUID (no clobbering) and show a summary.

---

## 8. API Design

Base URL: `/v1`. JSON over HTTPS. Auth: `Authorization: Bearer <access_token>`.

### 8.1 Auth

| Method | Path | Description |
|---|---|---|
| POST | `/auth/signup` | Email + password |
| POST | `/auth/login` | Returns access + refresh tokens |
| POST | `/auth/refresh` | Rotates the refresh token |
| POST | `/auth/oauth/{provider}` | Exchange provider token |
| POST | `/auth/logout` | Revoke the refresh token |
| DELETE | `/account` | Delete account and all data |

### 8.2 Sync

| Method | Path | Description |
|---|---|---|
| GET | `/sync?since=<cursor>&limit=500` | Changes since the cursor |
| POST | `/sync/push` | Batch of client mutations |

**Push request**
```json
{
  "mutations": [
    {
      "entity": "task",
      "op": "update",
      "id": "b0f7...",
      "updated_at": 1761290000000,
      "data": { "title": "Buy milk", "due_at": 1761307200000, "priority": 2 }
    }
  ]
}
```

**Pull response**
```json
{
  "cursor": "184223",
  "has_more": false,
  "changes": {
    "tasks": [ { "id": "...", "title": "...", "deleted_at": null } ],
    "lists": [],
    "subtasks": [],
    "tags": []
  }
}
```

### 8.3 Direct Resource Endpoints (optional, for a web client)

`GET/POST /tasks`, `GET/PATCH/DELETE /tasks/{id}`, and the same for `/lists`, `/tags`.

### 8.4 Errors and Limits

- Standard error body: `{ "error": { "code": "validation_failed", "message": "...", "fields": {...} } }`
- Status codes: 400, 401, 403, 404, 409 (conflict), 422, 429, 5xx.
- Rate limits: 60 req/min per user for sync; 10 req/min per IP for auth.

---

## 9. Notifications and Reminders

- Scheduled **locally** via the OS notification scheduler so they fire offline.
- On any task change, the Reminder service cancels and reschedules that task's notification.
- OS limits (iOS caps pending local notifications at 64): schedule the nearest 60 by `remind_at`, and re-fill on app open and on background refresh.
- Notification actions: **Complete**, **Snooze 1h**, **Tomorrow**.
- Recurring tasks: on completion, create the next occurrence and schedule it.
- Permission: request in context (when the first reminder is set), never at launch; show a settings deep link if denied.
- Time zones: store due times as UTC + `due_has_time`. All-day tasks use the device's local date and fire at a configurable default hour (default 9:00).

---

## 10. Key Algorithms

### 10.1 Recurrence

- Store an RFC 5545 RRULE subset (`FREQ`, `INTERVAL`, `BYDAY`, `BYMONTHDAY`, `UNTIL`/`COUNT`).
- On completion: compute the next occurrence from the **due date** (not the completion time) by default; offer a "from completion date" option.
- Only the next instance is materialized (no pre-generated series).

### 10.2 Natural-Language Date Parsing

- On-device parser (library or rule-based) for phrases such as "tomorrow", "next Fri 3pm", "in 2 hours".
- Recognized phrase is highlighted in the title and shown as a removable chip.

### 10.3 Fractional Ordering

- New item: `position = last + 1024`. Insert between a and b: `(a + b) / 2`.
- Rebalance a list (renumber by 1024 steps) in one transaction when any gap is too small.

---

## 11. Security and Privacy

- **Auth:** short-lived access token (15 min), rotating refresh token (30 days) stored in the OS keychain/keystore.
- **Passwords:** hashed with Argon2id server-side; breached-password check on sign-up.
- **Transport:** TLS only; certificate pinning optional.
- **Authorization:** row-level security and per-request ownership checks; never trust client-supplied `user_id`.
- **Local data:** SQLite stored in the app sandbox; optional database encryption (SQLCipher) as a setting.
- **Input validation:** length limits (title 500, notes 20k) on client and server.
- **Privacy:** data export and full account deletion (hard delete within 30 days); analytics are anonymous and opt-out.
- **Threats considered:** token theft (keystore, rotation), replayed pushes (idempotency keys), enumeration (uniform auth errors), abuse (rate limits).

---

## 12. Performance Strategy

- Render lists with a virtualized list (FlashList/FlatList), stable keys, memoized row components.
- Query via indexed SQLite; paginate Completed and Trash.
- Debounce search (200 ms) with an FTS5 index on title and notes.
- Avoid whole-store re-renders: narrow selectors per screen.
- Defer non-critical work (sync, reminder refill) until after first render.
- Budget: JS bundle under 5 MB; startup work under 300 ms before the first frame.

---

## 13. Error Handling and Edge Cases

| Scenario | Behavior |
|---|---|
| Offline | Everything works; the sync status shows "Offline, N pending" |
| Sync failure | Silent retry with backoff; surface a banner after 3 consecutive failures |
| Token expired | Refresh transparently; if refresh fails, prompt to sign in (local data kept) |
| Notification permission denied | Inline hint on the reminder chip with a link to settings |
| Clock or time zone change | Recompute and reschedule reminders on `timezone changed` events |
| Large lists | Virtualization plus pagination |
| App killed mid-write | SQLite transactions guarantee atomic task + outbox writes |
| DB migration failure | Roll back, keep the previous DB, report to crash tooling |
| Duplicate quick-add taps | Disable the button while saving; client UUIDs make the write idempotent |

---

## 14. Testing Strategy

- **Unit (target 80%+ for domain/data):** recurrence, date parsing, fractional ordering, conflict resolution, selectors.
- **Integration:** repository with an in-memory SQLite database; sync engine against a mock server (push/pull/retry/conflict).
- **Component:** TaskRow, QuickAddSheet, BottomTabs (active state, badge, center action).
- **E2E (Detox/Maestro):** create task -> appears in Today -> complete -> appears in Completed; tab state preservation; offline create then sync.
- **Accessibility:** automated audits plus manual screen reader passes (VoiceOver, TalkBack).
- **Performance:** benchmark with 5k and 20k tasks; startup time on a low-end device.
- **Backend:** API contract tests, RLS tests, load test on `/sync`.

---

## 15. CI/CD and Release

- **Pipeline:** lint, typecheck, unit tests, build on each PR; E2E on main nightly.
- **Builds:** cloud builds for iOS/Android; OTA updates for JS-only changes.
- **Environments:** dev, staging, production, each with its own backend and keys.
- **Release:** staged rollout (5%, 25%, 100%) with crash-rate gates; feature flags for risky features.
- **Backend:** versioned migrations, automatic backups, blue/green or rolling deploys.

---

## 16. Observability and Analytics

- **Crash and error reporting** with release/version tags.
- **Metrics:** sync latency and failure rate, API p95, notification schedule failures.
- **Product analytics (anonymous, opt-out):** task created, task completed, tab switched, reminder set, sign-in conversion.
- **Alerts:** API error rate above 2%, sync failure rate above 5%, crash-free sessions below 99%.

---

## 17. Roadmap

| Phase | Scope |
|---|---|
| **MVP (4-6 wks)** | Bottom nav, Today/Upcoming/Lists/Settings, quick-add, CRUD, due dates, local reminders, dark mode, local-only storage |
| **v1.0 (+4 wks)** | Accounts, sync, recurrence, subtasks, tags, search, export |
| **v1.1** | Widgets, notification actions, natural-language input, trash/restore |
| **v2** | Shared lists, web app, calendar integration, attachments |

---

## 18. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Sync conflicts lose data | High | Field-level merge, soft deletes, 30-day trash, conflict tests |
| iOS 64 pending notification cap | Medium | Rolling window scheduler with refills |
| Time zone / DST bugs | Medium | UTC storage, explicit tests around DST boundaries |
| Scope creep | Medium | Strict MVP list; features gated by roadmap |
| Bottom bar crowding small screens | Low | Max 5 tabs; labels short; tested at 320 dp width |

---

## 19. Open Questions

1. Should **Add** be a center tab button (as designed) or a floating button on each screen?
2. Is an **Inbox** list needed in addition to "no list"?
3. Backend: custom Node service or a managed backend (e.g., Supabase) for v1?
4. Is end-to-end encryption of task content a requirement?
5. Web client in v1.0 or deferred to v2?
