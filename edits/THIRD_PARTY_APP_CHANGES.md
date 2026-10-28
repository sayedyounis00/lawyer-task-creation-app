# Third-Party App (Manager App) — Required Changes

Supabase project: `lawmanagmentapp Project` (`cdyvlyqejrvkjwftajyn`, eu-west-1)
Applies to: the app where a **manager adds tasks for team members** (rows are written with `source = 'admin_app'`).

## 1. What changed in the database (summary)

| Before | Now |
|---|---|
| `anon` could read/write all of `tasks`, `team_members`, `device_managers` | `anon` has **no access** to these tables |
| Login via `login_device_manager` RPC, plain-text password | RPC **dropped**. Sign in with **Supabase Auth**, then link the account to a device with `link_manager_account` |
| Passwords stored in clear text | Passwords are **bcrypt-hashed** (existing row already converted) |
| Any client could pass any `device_id` | Isolation comes from the **server-side link** (`auth.uid()` -> `device_id`), never from a value the client sends |

The manager app gets the role **`manager`**. What it may do:

| Table | Allowed |
|---|---|
| `team_members` | SELECT own firm, columns `id, device_id, local_user_id, name, role_id, role_name, department, position, status, created_at, updated_at` only. No `username/phone/email`. No writes. |
| `tasks` | SELECT own firm. INSERT (see rules). UPDATE while status is `pending_review` or `todo`. No DELETE. |
| `device_managers`, `app_devices` | No access at all |

If the firm's license is inactive or expired, every query returns no rows / is rejected.

## 2. Setup (Supabase dashboard / app config)

1. Use only the **publishable (anon) key** in the app. Never ship the service-role key.
2. Auth -> enable Email provider. Decide on email confirmation (recommended: on).
3. Auth -> turn on **Leaked password protection** (still off).
4. Keep the Auth rate limits on their defaults or stricter.

## 3. Required code changes

### 3.1 Remove
- Any call to `login_device_manager` (no longer exists).
- Any request that works without signing in (anon access to `tasks` / `team_members`).
- Any use of an `x-device-id` header or `device_id` JWT claim for access. **Do not rely on it** (see the heads-up at the bottom).
- Any read of `device_managers` or `app_devices`.
- `select('*')` on `team_members` (it now fails with "permission denied for column"). Always list columns.

### 3.2 Sign-in flow

```ts
// 1) normal Supabase Auth login (create the account once with signUp)
const { error } = await supabase.auth.signInWithPassword({ email, password })

// 2) on app start, check whether this account is already linked
const { data: link } = await supabase.rpc('get_my_link')
// -> { linked: true, device_id, role: 'manager', license: { is_active, expires_at } }
//    or { linked: false }

// 3) first time only: link the account to the firm's device
const { data: res } = await supabase.rpc('link_manager_account', {
  p_device_id: 'LAW-XXXX-XXXX-XXXX-XXXX',
  p_password: managerDevicePassword,   // the firm manager's device password
  p_role: 'manager',
})
// res.success === true  -> proceed
```

`link_manager_account` error codes (`res.error`):

| Code | Meaning | Suggested UI |
|---|---|---|
| `NOT_AUTHENTICATED` | no Auth session | go to login |
| `INVALID_CREDENTIALS` | wrong device ID or password | show `res.message` |
| `TOO_MANY_ATTEMPTS` | 5 failures per user or 10 per device in 15 min | ask to wait 15 minutes |
| `DEVICE_NOT_FOUND` | device not registered for licensing | contact support |
| `SUBSCRIPTION_INACTIVE` | license inactive/expired | show renewal message |
| `INVALID_ROLE` | role not `manager`/`desktop` | bug |

Linking is stored on the server; the app does not need to keep the device password after a successful link.

### 3.3 List team members (for the "assign to" picker)

```ts
const { data } = await supabase
  .from('team_members')
  .select('id, name, role_name, position, department, status')
  .eq('status', 'active')
```

### 3.4 Create a task for a team member

```ts
await supabase.from('tasks').insert({
  title, description,
  priority,                 // 'high' | 'medium' | 'low'
  deadline_date,            // 'YYYY-MM-DD'
  deadline_time,            // 'HH:mm'  (still text columns)
  assigned_member_id,       // team_members.id (must belong to the same firm)
  assigned_to,              // member display name
  client_name, client_phone, case_title,   // optional
  source: 'admin_app',      // REQUIRED, exact value
  status: 'pending_review', // or 'todo'; no other value is accepted
})
```
- `device_id` is filled in by the server; you may omit it. If sent, it must equal your linked device.
- Do **not** send `completed_at` or `rejection_reason` on insert.
- Assigning to a member from another firm is rejected.

### 3.5 Read tasks / realtime

```ts
supabase.from('tasks').select('*').order('created_at', { ascending: false })
// realtime (RLS is applied to realtime too)
supabase.channel('tasks').on('postgres_changes',
  { event: '*', schema: 'public', table: 'tasks' }, handler).subscribe()
```

### 3.6 Editing

Allowed while `status` is `pending_review` or `todo`: title, description, priority, deadline, assignee, client fields.

Rejected with error code `42501`:
- changing `status`, `completed_at`, `rejection_reason` (these belong to the desktop app)
- changing `source`, `device_id`, `id`, `created_at`
- editing a task that is already `completed` or `rejected`
- deleting tasks (ask the desktop to remove them)

### 3.7 Status lifecycle (display only)

`pending_review` -> (desktop accepts) -> `todo` -> (desktop completes) -> `completed`
`pending_review` -> (desktop rejects) -> `rejected` + `rejection_reason`

Completed tasks are deleted automatically after 48 hours (hourly job). Show them promptly.

### 3.8 License handling

When the license expires, `tasks`/`team_members` queries stop returning data. Call `get_my_link` and show the license state instead of an empty list.

## 4. Test checklist
- [ ] Not signed in: selecting `tasks` fails.
- [ ] Signed in but not linked: `tasks` returns nothing.
- [ ] After linking: team members list works, `select('*')` on `team_members` fails (expected).
- [ ] Insert with `source: 'admin_app'` works; with another source fails.
- [ ] Update status from the app fails (expected).
- [ ] A second firm's account never sees the first firm's data.

## 5. Heads-up (open item on the database side)
Policies named `tasks_device_*` and `team_members_device_*` (they trust an `x-device-id` header via `get_current_device_id()`) exist in the database but were not created by this migration. They let any signed-in user read/write a firm's rows by sending that header, which bypasses the rules above. They must be removed before this app is considered secure; confirm with the DB owner.
