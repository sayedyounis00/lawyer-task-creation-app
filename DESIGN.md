# Design System: Todo List App & Office Task Desk

<!-- impeccable:design-tokens -->

## 1. Thesis & Metaphor

A lightning-fast, tactile task command center with a 5-destination bottom navigation bar designed for effortless one-thumb control on mobile and structured command clarity on desktop. Work is captured in under 3 seconds, grouped into intelligent views (Today, Upcoming, Lists/Roster), and backed by instant offline-first persistence.

## 2. Design Tokens

### Color Tokens (Light & Dark)

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg-main` | `#FFFFFF` | `#0F1115` | Canvas background |
| `--surface` | `#F5F6F8` | `#1A1D23` | Cards, elevated surfaces, sheets |
| `--surface-raised` | `#FFFFFF` | `#22262E` | Modals, drawers, popovers |
| `--border-subtle` | `#E5E7EB` | `#2D323B` | Structural dividers, card borders |
| `--border-strong` | `#D1D5DB` | `#3E4451` | Focus states, active borders |
| `--text-primary` | `#111827` | `#F3F4F6` | Primary titles, bold labels |
| `--text-secondary` | `#6B7280` | `#9CA3AF` | Meta copy, timestamps, secondary labels |
| `--brand-primary` | `#4F46E5` | `#818CF8` | Primary action accent, active tabs, FAB |
| `--brand-hover` | `#4338CA` | `#6366F1` | Interactive hover & pressed state |
| `--danger` | `#DC2626` | `#F87171` | Overdue badge, delete action, alerts |
| `--success` | `#16A34A` | `#4ADE80` | Completed state, success confirmations |
| `--warning` | `#D97706` | `#FBBF24` | Pending review, medium priority |

### Dimensions & Spatial Scale

- **Spacing scale**: 4px, 8px, 12px, 16px, 24px, 32px
- **Corner radii**:
  - `8px` (`rounded-lg`): Task rows, chips, controls, inputs
  - `16px` (`rounded-2xl`): Bottom sheets, modal dialogs, drawers
  - `999px` (`rounded-full`): Center FAB, pills, avatar rings, status dots
- **Bottom Navigation Bar**: Height 64px + `env(safe-area-inset-bottom)`.
- **Center Add Button**: 56px elevated FAB, positioned at tab 3.

## 3. Information Architecture: 5 Destinations

1. **Today**: Date header ("Saturday, Oct 24") + circular progress metric (completed/total). Overdue tasks section (collapsible, red accent), Today's tasks, Completed tasks (collapsible).
2. **Upcoming**: Grouped by target dates (Tomorrow, weekday names, future dates).
3. **Add (Center)**: 56px elevated action button opening the Quick Add Sheet over the current view.
4. **Lists / Team**: Smart views (All, Overdue, In Progress, Completed, Pending) and Team Roster with workload distribution and member management.
5. **Settings**: Device session info, light/dark theme switch, office credentials info, sign-out.

## 4. Interaction Floor & Accessibility

- **Touch Targets**: Strictly ≥ 48px on all interactive elements across mobile & touch devices.
- **Keyboard Navigation**: High-contrast visible focus rings (`outline: 2px solid #4F46E5`).
- **Bi-directional Text**: Explicit `dir="auto"` on all names, task titles, descriptions, and user inputs.
- **Safe Areas**: Strict adherence to `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- **Single-tap Completion**: Instant optimistic completion toggle with undo toast.
