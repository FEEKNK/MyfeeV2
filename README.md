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

MyFee V2 is a modern, mobile-first Progressive Web App built with React 19 and Vite. It combines **vocabulary learning**, **habit tracking**, **personal finance**, **project management**, and **productivity tools** into a single, beautifully designed glassmorphic interface with 3D backgrounds powered by Spline.

> **Target Users:** Students and self-learners who want a unified personal development dashboard.

---

## 🎯 Features

### 📖 Learning & Development
| Feature | Description |
|---------|-------------|
| **Flashcards** | Oxford 3000 vocabulary cards with spaced repetition, text-to-speech, and progress tracking |
| **Quiz Mode** | 3 quiz formats — multiple choice, listening, and spelling |
| **Code Reading** | Practice reading HTML, CSS, JavaScript, and SQL code snippets |

### ✅ Task & Project Management
| Feature | Description |
|---------|-------------|
| **To-Do List** | Task management with filters (all / active / done) |
| **Habit Tracker** | Daily habit tracking with streak counting and history |
| **Projects** | Project boards with subtasks and status management |
| **Notes & Diary** | Personal notes with mood tracking and pinning |

### 💰 Finance
| Feature | Description |
|---------|-------------|
| **Income & Expense Tracking** | Categorized transaction logging with monthly summaries |
| **Savings Goals** | Goal-based savings with deposit tracking and progress visualization |
| **Budget Management** | Daily and monthly budget configuration |

### 🧘 Wellness & Productivity
| Feature | Description |
|---------|-------------|
| **Pomodoro Timer** | Focus timer with 25-minute work sessions |
| **Wim Hof Breathing** | Guided breathing exercises (3 rounds × 30 breaths) |
| **Countdown** | Event countdown timers for important dates |

### 🔒 Security & Settings
| Feature | Description |
|---------|-------------|
| **4-Digit PIN Lock** | App-level PIN authentication on launch |
| **Dark / Light Theme** | Full dark mode and light mode with smooth transitions |
| **Streak System** | Daily engagement tracking with streak counter |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [React 19](https://react.dev/) |
| **Build Tool** | [Vite 8](https://vite.dev/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) + Custom Glassmorphism |
| **Animation** | [Framer Motion 13](https://www.framer.com/motion/) |
| **3D Background** | [Spline](https://spline.design/) |
| **State Management** | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| **Routing** | [React Router 7](https://reactrouter.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Backend / Auth** | [Supabase](https://supabase.com/) (optional cloud sync) |
| **Linting** | [Oxlint](https://oxc.rs/) |

---

## 📁 Project Structure

```
MyFeeV2/
├── public/                  # Static assets (logo, icons)
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AuthModal.jsx        # Authentication modal
│   │   ├── ChangePinModal.jsx   # PIN change modal
│   │   ├── PinLockScreen.jsx    # App lock screen
│   │   ├── DataMigration.jsx    # Import/export data
│   │   ├── FlashcardWidget.jsx  # Flashcard widget
│   │   └── TodoWidget.jsx       # Todo widget
│   ├── data/                # Static data & seed data
│   │   ├── vocabulary.js        # Oxford 3000 word list
│   │   └── seedData.js          # Initial app data
│   ├── lib/                 # Library configurations
│   │   └── supabase.js          # Supabase client setup
│   ├── pages/               # Page components (15 pages)
│   │   ├── HomePage.jsx         # Dashboard with grid menu
│   │   ├── FlashcardPage.jsx    # Vocabulary flashcards
│   │   ├── TodoPage.jsx         # To-do list
│   │   ├── HabitPage.jsx        # Habit tracker
│   │   ├── FinancePage.jsx      # Income & expense
│   │   ├── GoalsPage.jsx        # Savings goals
│   │   ├── NotesPage.jsx        # Notes & diary
│   │   ├── ProjectsPage.jsx     # Project management
│   │   ├── PomodoroPage.jsx     # Pomodoro timer
│   │   ├── CountdownPage.jsx    # Event countdowns
│   │   ├── BreathingPage.jsx    # Wim Hof breathing
│   │   ├── QuizPage.jsx         # Vocabulary quiz
│   │   ├── CodeReadingPage.jsx  # Code reading practice
│   │   ├── SettingsPage.jsx     # App settings
│   │   └── MorePage.jsx         # Feature directory
│   ├── router/              # Route configuration
│   │   └── AppRouter.jsx        # App routing & navigation
│   ├── services/            # API services
│   │   └── supabaseSync.js      # Cloud sync logic
│   ├── store/               # Global state
│   │   └── useStore.js          # Zustand store
│   ├── App.jsx              # Root component
│   ├── App.css              # App-level styles
│   ├── index.css            # Global styles & theme
│   └── main.jsx             # Entry point
├── supabase_schema.sql      # Database schema for Supabase
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── package.json             # Dependencies & scripts
└── .env                     # Environment variables (git-ignored)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or yarn / pnpm)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MyFeeV2.git
cd MyFeeV2

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials (optional)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint for code linting |

---

## ☁️ Supabase Setup (Optional)

Cloud sync is **optional**. The app works fully offline using `localStorage`. To enable cloud sync:

1. Create a project at [supabase.com](https://supabase.com/)
2. Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the contents of supabase_schema.sql and execute in Supabase Dashboard → SQL Editor
```

3. Add your credentials to `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Enable **Email Auth** in Supabase Dashboard → Authentication → Providers

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository on [vercel.com](https://vercel.com/)
3. Add environment variables in Vercel's project settings
4. Create `vercel.json` for SPA routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

5. Deploy — Vercel will auto-build and serve via global CDN

---

## 🔐 Default PIN

The app launches with a **4-digit PIN lock screen**.

| | |
|---|---|
| **Default PIN** | `3804` |

You can change the PIN or disable it in **Settings → Security & PIN**.

---

## 📸 Screenshots

> _Coming soon — add screenshots of the app here._

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Oxford 3000 Word List](https://www.oxfordlearnersdictionaries.com/wordlists/oxford3000-5000) — Vocabulary data
- [Spline](https://spline.design/) — 3D interactive backgrounds
- [Lucide Icons](https://lucide.dev/) — Beautiful open-source icons
- [Supabase](https://supabase.com/) — Open-source Firebase alternative

---

<div align="center">

**Built with ❤️ using React + Vite**

</div>
