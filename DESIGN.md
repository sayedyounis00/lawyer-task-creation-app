# Design System: Todo List App & Office Task Desk

<!-- impeccable:design-tokens -->

## 1. Thesis & Metaphor

A lightning-fast, tactile task command center with a 5-destination bottom navigation bar designed for effortless one-thumb control on mobile and structured command clarity on desktop. Work is captured in under 3 seconds, grouped into intelligent views (Today, Upcoming, Lists/Roster), and backed by instant offline-first persistence.

## 2. Design Tokens

### Color Tokens (Legal CRM Schema — Light Theme Only)

| Token | Hex | Role | Usage |
|---|---|---|---|
| `--bg-main` | `#F4F5F7` | Neutral 100 | Main application canvas |
| `--surface` | `#FFFFFF` | Neutral 0 | Primary surface, cards, panels |
| `--surface-raised` | `#FFFFFF` | Neutral 0 | Modals, drawers, sheets |
| `--surface-sidebar` | `#0F2A47` | Navy 900 | Left navigation light anchor |
| `--border-subtle` | `#E7E9EC` | Neutral 200 | Table zebra striping, card borders |
| `--border-strong` | `#D0D4DA` | Neutral 300 | Input outlines, structural dividers |
| `--text-primary` | `#1A1D21` | Neutral 900 | Primary body text, headings |
| `--text-secondary` | `#3F444B` | Neutral 700 | Supporting text, table body text |
| `--text-muted` | `#6B7280` | Neutral 500 | Placeholder text, timestamps |
| `--brand-primary` | `#0F2A47` | Navy 900 | Header bar, primary buttons, active nav |
| `--brand-hover` | `#1E3F63` | Navy 700 | Primary button hover, active states |
| `--brand-light` | `#DCE6F0` | Navy 100 | Selected row bg, subtle highlight |
| `--accent-brass` | `#A6802B` | Brass 600 | Key CTAs, badges, VIP tags |
| `--danger` | `#B3261E` | Danger | Overdue filings, past-due, alerts |
| `--success` | `#1E7A4C` | Success | Completed tasks, paid invoices |
| `--warning` | `#B4741B` | Warning | Pending review, approaching deadlines |

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
