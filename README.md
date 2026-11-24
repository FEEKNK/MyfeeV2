<div align="center">

# 📱 MyFee V2

**แอปพัฒนาตนเองแบบ All-in-One สำหรับการเรียนรู้ การจัดการงาน และการเงินส่วนตัว**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud_Sync-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

</div>

---

## ✨ Overview

MyFee V2 is a modern, mobile-first Progressive Web App built with React 19 and Vite. It combines **vocabulary & sentence learning**, **habit tracking**, **personal finance**, **project management**, **Thai football schedule**, and **productivity tools** into a unified glassmorphic interface with lazy-loaded 3D Spline backgrounds.

---

## 🎯 Features

### 📖 Learning & Development
| Feature | Description |
|---------|-------------|
| **Sentence Flow** | Chinese & English sentence patterns with Chunking, TTS audio (1.0x / 0.75x), Speech Shadowing, and Sentence Builder |
| **Flashcards** | Oxford 3000 vocabulary cards (lazy-loaded) with text-to-speech and mastery tracking |
| **Quiz Mode** | 3 quiz formats — meaning, listening, and spelling |
| **Code Reading** | Practice reading HTML, CSS, JavaScript, Node.js, React, and SQL code snippets |

### ✅ Task & Project Management
| Feature | Description |
|---------|-------------|
| **To-Do List** | Task management with inline editing and filters (all / active / done) |
| **Habit Tracker** | Daily habit tracking by routine with local-timezone streak counting and 7-day heatmap |
| **Projects** | Project boards with subtasks and status management |
| **Notes & Diary** | Personal notes with mood tracking, pinning, and modal editor |

### 💰 Finance & Tracking
| Feature | Description |
|---------|-------------|
| **Income & Expense Tracking** | Satang-accurate transaction logging, custom categories, recurring transactions, and charts |
| **AI Spending Analysis** | Server-proxied Gemini AI financial insights with safe Markdown rendering |
| **Budget Progress** | Daily and monthly budget progress indicators |
| **Savings Goals** | Goal-based savings with deposit tracking and progress visualization |
| **Thai Football Schedule** | Match tracker with server-proxied AI schedule updates |

### 🧘 Wellness & Productivity
| Feature | Description |
|---------|-------------|
| **Pomodoro Timer** | Timestamp-accurate focus/break timer with Web Audio chime and synced session stats |
| **Wim Hof Breathing** | Guided breathing exercises (3 rounds × 30 breaths) |
| **Countdown** | Event countdown timers for important dates |

### 🔒 Security & Sync
| Feature | Description |
|---------|-------------|
| **Optional 4-Digit PIN Lock** | PBKDF2-SHA256 client lock screen (opt-in setup in Settings, fail-closed verification) |
| **Authenticated Cloud Sync** | Per-user Supabase Auth + RLS (`auth.uid() = user_id`) and Realtime sync |
| **Server-Side AI Proxy** | `/api/gemini` Serverless Function with IP rate limiting & JWT verification |
| **JSON Backup & Restore** | Schema-validated export/import for offline portability |

---

## 🛠️ Tech Stack

- **Framework:** React 19, Vite 8, React Router 7, Zustand 5
- **Styling & Animation:** Tailwind CSS 4, Framer Motion 13, Lucide React
- **3D Background:** `@splinetool/react-spline` (lazy-loaded on idle)
- **Backend / Auth / Sync:** Supabase (`@supabase/supabase-js`)
- **AI Proxy:** Vercel Serverless Function (`/api/gemini.js`) + Vite dev proxy
- **Linting:** Oxlint

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

> **Security Note:** Never prefix `GEMINI_API_KEY` with `VITE_` so it is never compiled into client-side bundles.

```bash
# 3. Start development server
npm run dev

# 4. Lint & build
npm run lint
npm run build
```

---

## ☁️ Supabase Setup (Optional)

1. Create a project at [supabase.com](https://supabase.com/)
2. Run `supabase_schema.sql` in **Supabase Dashboard → SQL Editor** (enables per-user RLS `auth.uid() = user_id` and Realtime)
3. Enable **Email Auth** in **Supabase Dashboard → Authentication → Providers**
4. Sign in via **Settings → Supabase Cloud → เข้าสู่ระบบ**

---

## 🔐 App Lock PIN

No hardcoded default PIN is used. To enable the lock screen:
1. Open **Settings → ความปลอดภัย & PIN**
2. Toggle **ล็อกแอปด้วย PIN (4 หลัก)** or click **ตั้งรหัส** to create your 4-digit PIN.

---

## 📄 License

This project is licensed under the **MIT License**.
