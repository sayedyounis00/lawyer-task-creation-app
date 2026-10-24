# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing Next.js 16 (App Router) + React 19 + Tailwind CSS 4. Data: Supabase project `lawmanagmentapp Project` (`cdyvlyqejrvkjwftajyn`).

## Users

Primary user: a law-office admin / firm manager on a registered device. They sign in with that device ID and the admin password stored for the device, then assign work to team members.

## Product Purpose

Let the admin create, edit, and delete office tasks in Supabase, assign each task to a team member, and maintain the team roster. Success is: every change in the UI is persisted in the database and visible after reload.

## Positioning

Device-bound office control: one device ID unlocks that office’s tasks and people. Not a general SaaS workspace and not a client-facing intake app.

## Operating Context

Existing tables: `device_managers` (login: `device_id` + plaintext `password`), `team_members` (roster, keyed by `device_id`), `tasks` (work items with `assigned_member_id` → `team_members.id` and `device_id`). Live data already includes device `LAW-AED4-BDEC-79E1-EE41` and member السيد سيف. Companion apps may already write `source`, client, and case fields on tasks.

## Capabilities and Constraints

- Login: `device_managers` only, matching `device_id` and `password`.
- After login, read/write `tasks` and `team_members` for that `device_id` only.
- Tasks: create, edit, delete, show status, assign to a team member (`assigned_member_id` plus `assigned_to` name).
- Team members: view-only list for assigning tasks and monitoring workload; member roster is managed externally.
- Do not invent extra product tables. Do not display manager passwords.
- `tasks.assigned_member_id` already foreign-keys to `team_members.id`; keep using it.
- Interface: Full Arabic UI with native RTL layout and Cairo typography (`lang="ar" dir="rtl"`).

## Brand Commitments

Working name from the repo: lawyer task creation app / law office task desk. No separate brand assets.

## Evidence on Hand

Real Supabase schema and one live team member. Tasks table currently has no rows. No marketing copy, logos, or testimonials — do not fabricate firms, clients, or case results.

## Product Principles

- The database is the source of truth; the UI never keeps a private copy of tasks or members.
- Assignment is a person, not a free-text nickname (write both id and name).
- One device, one office: never mix another device’s rows.
- Admin password stays on the server; the browser only keeps a session.
- Status is visible on every task without opening it.
