# Design System: Modern Legal Executive

<!-- impeccable:design-tokens -->

## 1. Thesis & Metaphor

A high-performance modern legal command center for law-firm managers and senior partners. Replaces obsolete paper clutter with crisp executive slate architecture, real-time workload intelligence, instant task dispatching, and fluid responsive mobility.

## 2. Palette Tokens

| Token | Hex | Role |
|---|---|---|
| `--bg-main` | `#f8fafc` | Main application background (slate-50) |
| `--surface` | `#ffffff` | Elevated cards, dialogs, drawers |
| `--surface-subtle` | `#f1f5f9` | Control wells, table headers, inactive tabs |
| `--border-subtle` | `#e2e8f0` | Dividers, card strokes, inactive inputs |
| `--border-strong` | `#cbd5e1` | Focus borders, active controls |
| `--text-primary` | `#0f172a` | Headers, primary titles, active labels |
| `--text-secondary` | `#334155` | Field descriptions, meta copy |
| `--text-muted` | `#64748b` | Timestamps, auxiliary details |
| `--brand-primary` | `#2563eb` | Primary CTAs, active highlights |
| `--brand-hover` | `#1d4ed8` | Button hover states |
| `--status-pending` | `#d97706` | Pending review status (amber) |
| `--status-progress` | `#4f46e5` | In-progress work (indigo) |
| `--status-done` | `#059669` | Completed records (emerald) |
| `--status-rejected` | `#dc2626` | Rejected / cancelled tasks (crimson) |

## 3. Typography Hierarchy

- **Font Family**: Source Sans 3, system-ui, -apple-system, sans-serif
- **Scale**:
  - H1 / Office Title: `1.5rem` (`24px`), font-weight 700, tracking `-0.025em`
  - H2 / Section Title: `1.125rem` (`18px`), font-weight 700, tracking `-0.02em`
  - Card Title: `1rem` (`16px`), font-weight 600, line-height 1.4
  - Body / Data: `0.875rem` (`14px`), font-weight 400 & 500
  - Micro / Badges: `0.75rem` (`12px`), font-weight 600, uppercase or numeric

## 4. Layout Architecture & Surfaces

- **Desktop (1024px+)**:
  - Sticky top header with office brand, device key pill, quick-action trigger, and sign-out.
  - KPI Stat Bar: 5 metrics (Total Tasks, Pending Review, In Progress, Completed, Overdue).
  - Main workspace with segmented tab bar (Tasks / Team Roster).
  - Slide-over Drawer for Task Creation, Task Editing, and Member Onboarding.
- **Mobile (< 768px)**:
  - Sticky compact brand header.
  - Native-feeling fixed bottom navigation bar with 48px+ touch targets: Tasks tab, Prominent center "+ New Task" FAB, Team tab.
  - Smooth bottom sheet for task creation/editing with drag affordance.

## 5. Interaction Floor

- Touch targets: strictly ≥ 48px for all mobile interactive zones.
- Keyboard navigation: visible focus rings with `outline: 2px solid #2563eb`.
- Bi-directional text: `dir="auto"` on all names, case titles, descriptions, and user input.
- Zero layout shift: skeletons and stable dimensions during transitions.
