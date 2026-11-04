# ⚖️ Lawyer Task Desk (نظام إدارة مهام مكتب المحاماة)

A specialized task management and workload assignment web application designed for law office administrators and firm managers. Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Supabase**.

---

## 🌟 Key Highlights

- **Device-Bound Security**: Secured sign-in bound by hardware Device ID and manager credentials (`device_managers`).
- **Comprehensive Task Desk**: Create, prioritize, update, and track legal tasks and court/case assignments with real-time database synchronization.
- **Team Roster & Workload Distribution**: Assign tasks directly to verified firm associates and paralegals with integrated accountability (`team_members`).
- **Native RTL & Arabic UI**: Full Arabic language interface crafted specifically for legal workflows (`dir="rtl"`).
- **Persistent Supabase Backend**: Integrated directly with PostgreSQL tables (`device_managers`, `team_members`, `tasks`) and Row-Level security.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4, PostCSS |
| **Backend & Database** | Supabase (PostgreSQL) |
| **Deployment** | Vercel |

---

## 📂 Project Structure

```text
lawyer-task-creation-app/
├── app/                  # Next.js App Router (pages, layout, Arabic RTL setup)
├── design-system/        # Color tokens, legal desk components & guidelines
├── lib/                  # Supabase client and auth utilities
├── color-pallete/        # Law office thematic palette
├── DESIGN.md             # UI/UX design tokens and component specs
└── PRODUCT.md            # Product schema, security rules and operating context
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/sayedyounis00/lawyer-task-creation-app.git
cd lawyer-task-creation-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

---

## 📄 License

This project is licensed under the MIT License.
