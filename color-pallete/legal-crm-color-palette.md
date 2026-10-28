# Legal CRM — Color Palette Schema

**Theme:** Light only
**Purpose:** Trustworthy, authoritative, calm — built for long screen sessions (case files, billing, client records) with clear status signaling for matters, deadlines, and priorities.

---

## 1. Brand Direction

Legal software needs to feel **credible, precise, and unhurried**. The palette leans on a deep navy (trust, authority — the "ink and paper" of law) paired with a warm brass/gold accent (used sparingly, like a wax seal) and a clean neutral gray scale for structure. Status colors are desaturated enough to stay calm in a dense data table.

---

## 2. Primary Colors

| Name               | Hex       | RGB           | Usage                                                     |
| ------------------ | --------- | ------------- | --------------------------------------------------------- |
| Primary / Navy 900 | `#0F2A47` | 15, 42, 71    | Header bar, primary buttons, active nav item, logo mark   |
| Primary / Navy 700 | `#1E3F63` | 30, 63, 99    | Button hover, active states, sidebar background           |
| Primary / Navy 500 | `#2F5A85` | 47, 90, 133   | Links (default), icon accents, focus outlines             |
| Primary / Navy 300 | `#7FA0C0` | 127, 160, 192 | Secondary icons, chart lines, disabled-primary states     |
| Primary / Navy 100 | `#DCE6F0` | 220, 230, 240 | Selected row background, subtle highlight, tag background |

## 3. Accent Colors

| Name               | Hex       | RGB           | Usage                                                              |
| ------------------ | --------- | ------------- | ------------------------------------------------------------------ |
| Accent / Brass 600 | `#A6802B` | 166, 128, 43  | Premium/VIP client tags, key CTAs (e.g. "Sign", "Approve"), badges |
| Accent / Brass 400 | `#C9A24C` | 201, 162, 76  | Hover on accent elements, highlighted case value figures           |
| Accent / Brass 100 | `#F3E9D2` | 243, 233, 210 | Accent background chips, subtle celebratory states (matter won)    |

## 4. Neutral / Gray Scale

| Name        | Hex       | RGB           | Usage                                         |
| ----------- | --------- | ------------- | --------------------------------------------- |
| Neutral 900 | `#1A1D21` | 26, 29, 33    | Primary body text, headings                   |
| Neutral 700 | `#3F444B` | 63, 68, 75    | Secondary text, table body text               |
| Neutral 500 | `#6B7280` | 107, 114, 128 | Placeholder text, timestamps, metadata labels |
| Neutral 300 | `#D0D4DA` | 208, 212, 218 | Borders, dividers, input outlines             |
| Neutral 200 | `#E7E9EC` | 231, 233, 236 | Table zebra striping, card borders            |
| Neutral 100 | `#F4F5F7` | 244, 245, 247 | App background, panel background              |
| Neutral 0   | `#FFFFFF` | 255, 255, 255 | Cards, modals, primary surface                |

## 5. Semantic / Status Colors

Used for case status, deadlines, invoices, and alerts. Each has a text-safe "on-light" variant and a soft background for badges/pills.

| Status            | Text/Icon | Background | Border    | Typical Use                                              |
| ----------------- | --------- | ---------- | --------- | -------------------------------------------------------- |
| Success           | `#1E7A4C` | `#E5F4EC`  | `#B8E0C9` | Case won, invoice paid, task complete                    |
| Warning           | `#B4741B` | `#FBEFDD`  | `#EFCE9C` | Deadline approaching, review needed                      |
| Danger / Critical | `#B3261E` | `#FBE7E6`  | `#F0B6B2` | Overdue filing, statute of limitations, past-due invoice |
| Info              | `#1F5FA8` | `#E7F0FA`  | `#BBD7EF` | New document uploaded, informational notice              |
| Neutral / Pending | `#5B6472` | `#EDEEF1`  | `#D3D6DC` | Draft, pending review, unassigned                        |

## 6. Matter / Case Priority Tags

| Priority | Text      | Background |
| -------- | --------- | ---------- |
| Urgent   | `#8C1E17` | `#FADCDA`  |
| High     | `#B4741B` | `#FBEFDD`  |
| Standard | `#2F5A85` | `#DCE6F0`  |
| Low      | `#5B6472` | `#EDEEF1`  |

## 7. Surfaces & Layout

| Token                 | Hex       | Usage                                                                                      |
| --------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `surface-app-bg`      | `#F4F5F7` | Main application canvas                                                                    |
| `surface-card`        | `#FFFFFF` | Cards, panels, modals                                                                      |
| `surface-sidebar`     | `#0F2A47` | Left navigation (dark surface used intentionally as a light-theme anchor, not a dark mode) |
| `surface-header`      | `#FFFFFF` | Top bar, with `Neutral 200` bottom border                                                  |
| `surface-input`       | `#FFFFFF` | Text fields, with `Neutral 300` border                                                     |
| `surface-input-focus` | `#FFFFFF` | Border becomes `Primary 500`, 2px focus ring `Primary 100`                                 |

## 8. Text Colors

| Token             | Hex       | Usage                                 |
| ----------------- | --------- | ------------------------------------- |
| `text-primary`    | `#1A1D21` | Headings, body copy                   |
| `text-secondary`  | `#3F444B` | Supporting text, table cells          |
| `text-muted`      | `#6B7280` | Timestamps, helper text, placeholders |
| `text-on-primary` | `#FFFFFF` | Text on navy buttons/sidebar          |
| `text-link`       | `#2F5A85` | Default link                          |
| `text-link-hover` | `#1E3F63` | Link hover/active                     |
| `text-disabled`   | `#A7ACB4` | Disabled labels                       |

## 9. Buttons

| Variant             | Background  | Text      | Hover     | Border            |
| ------------------- | ----------- | --------- | --------- | ----------------- |
| Primary             | `#0F2A47`   | `#FFFFFF` | `#1E3F63` | none              |
| Secondary           | `#FFFFFF`   | `#0F2A47` | `#DCE6F0` | `#0F2A47` (1.5px) |
| Accent (key action) | `#A6802B`   | `#FFFFFF` | `#8F6C23` | none              |
| Destructive         | `#B3261E`   | `#FFFFFF` | `#8F1D17` | none              |
| Ghost / Tertiary    | transparent | `#2F5A85` | `#F4F5F7` | none              |
| Disabled            | `#E7E9EC`   | `#A7ACB4` | —         | none              |

## 10. Data Visualization Set (charts, billing graphs, matter volume)

| Series | Hex       |
| ------ | --------- |
| 1      | `#0F2A47` |
| 2      | `#A6802B` |
| 3      | `#2F5A85` |
| 4      | `#6FA287` |
| 5      | `#B4741B` |
| 6      | `#7FA0C0` |
| 7      | `#8C4A5B` |

## 11. Accessibility Notes

- `Neutral 900` on `Neutral 0` → contrast ratio **15.6:1** (AAA for body text).
- `Text-link (#2F5A85)` on white → **5.4:1** (AA for normal text).
- `text-on-primary (#FFFFFF)` on `Primary 900 (#0F2A47)` → **11.9:1** (AAA).
- Never rely on status color alone for meaning — pair every semantic/priority tag with a text label or icon (important for colorblind users reviewing case status).
- Keep `Brass` accent usage under ~10% of any screen — it's a highlight color, not a structural one.

## 12. Usage Guidelines

**Do**

- Use Navy 900 only for header, primary nav, and primary buttons — keep it as the "anchor" color so it stays authoritative.
- Use Brass sparingly, for moments that matter (signing, high-value client, revenue milestones).
- Keep case-list and table backgrounds white/Neutral 100 with Neutral 200 borders for a calm, scannable surface.

**Don't**

- Don't introduce additional blues outside the Navy/Primary scale — it will read as inconsistent branding.
- Don't use Danger red for anything that isn't a true risk/deadline signal — overuse breaks trust in the alert system.
- Don't build a dark-mode variant of these tokens for this release; this schema is light-theme only by design.
