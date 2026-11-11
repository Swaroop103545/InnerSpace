# InnerSpace

A personal, cross-platform journaling and reflection mobile app built with **Expo**, **React Native**, **TypeScript**, **Redux Toolkit**, and **Firebase**.

> *A little space to meet yourself.*

---

## Features

- **Dark Minimalist Onboarding** (`src/screens/OnboardingScreen.tsx`, `src/components/OnboardingArtworks.tsx`)
  - Three swipeable showcase screens — **Plan your day**, **Build the Future**, and **Your stories live** — powered by native-driver geometric animations (`Animated`), persisted in `AsyncStorage`, and replayable via `/onboarding` or the sign-in header.
- **Authentication & Demo Mode** (`src/screens/AuthScreens.tsx`, `src/services/authService.ts`, `src/app/index.tsx`)
  - Email/password login, registration, and password reset through Firebase Authentication with `AsyncStorage` persistence, plus a Demo Mode fallback when Firebase environment variables are not configured.
- **Journal Feed & Entry Composer** (`src/screens/HomeScreen.tsx`, `src/screens/NewEntryScreen.tsx`, `src/components/CardDetailModal.tsx`)
  - Collapsible monthly entry sections, newest/oldest sorting, full-text search, quick mood and `#tag` filters, favorite starring, rich entry creation/editing, and full card detail previews.
- **Calendar View** (`src/screens/CalendarScreen.tsx`, `src/utils/entryDates.ts`)
  - Maps journal entries onto a monthly calendar grid, shows per-day memory previews, and supports creating entries tied to specific dates.
- **People & Mentions Map** (`src/screens/UsersMapScreen.tsx`, `src/utils/nameExtractor.ts`)
  - Automatically extracts people names and kinship terms from journal entries, counts mention frequency across entries, tracks associated moods/dates, and lets you assign relationship tags (`Family`, `Friend`, `Partner`, `Mentor`, `Colleague`), personal notes, and jump directly to mentioned entries.
- **Author Profile & Writing Analytics** (`src/screens/ProfileScreen.tsx`)
  - Cross-platform display name & personal quote editor, interactive 7-day activity bar chart, live & longest writing streak calculation, persistent weekly writing goals (`3` / `5` / `7` active days/week), total word & photo counters, mood reflections breakdown, clickable top theme tags, Favorite Memories viewer, plain-text journal export via native share sheet, and Firebase cloud sync/reset actions.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Framework | Expo `~58.0.23`, Expo Router `~58.0.30`, React `19.3.0`, React Native `0.88.1` |
| Language | TypeScript `~6.0.3` (`strict: true`, `@/*` alias to `./src/*`) |
| State Management | Redux Toolkit `^2.13.0`, React Redux `^9.3.1` |
| Backend & Storage | Firebase `^13.2.0` (Auth & Firestore), `@react-native-async-storage/async-storage` `2.2.0` |
| UI & Typography | `@expo/vector-icons`, `@expo-google-fonts/playfair-display`, `@expo-google-fonts/caveat`, `react-native-safe-area-context`, `react-native-gesture-handler` |

---

## Project Structure

```text
InnerSpace/
├── App.js
├── app.json
├── .env.example
├── package.json
├── tsconfig.json
└── src/
    ├── app/
    │   ├── _layout.tsx                 # Root Redux, GestureHandler & SafeArea stack layout
    │   ├── index.tsx                   # App entry: onboarding gate, auth state & HomeScreen
    │   ├── onboarding.tsx              # Expo Router route for /onboarding
    │   └── new-entry.tsx               # Expo Router route for /new-entry
    ├── components/
    │   ├── BottomNavBar.tsx            # Floating 5-tab navigation bar (home, calendar, add, users, profile)
    │   ├── CardDetailModal.tsx         # Full journal entry detail & actions modal
    │   ├── EntriesHeader.tsx           # Collapsible monthly section headers
    │   ├── Header.tsx                  # Shared screen header component
    │   ├── JournalCard.tsx             # Journal entry card presentation
    │   └── OnboardingArtworks.tsx      # Native-driver animated artworks for the 3 onboarding slides
    ├── screens/
    │   ├── AuthScreens.tsx             # Login & registration screens
    │   ├── CalendarScreen.tsx          # Monthly calendar mapped to journal entries
    │   ├── HomeScreen.tsx              # Main dashboard, feed, filters & tab coordinator
    │   ├── NewEntryScreen.tsx          # Journal composer & editor screen
    │   ├── OnboardingScreen.tsx        # 3-slide dark onboarding showcase
    │   ├── ProfileScreen.tsx           # Author profile, streaks, weekly goal & insights
    │   ├── SplashScreen.tsx            # Animated brand splash component
    │   └── UsersMapScreen.tsx          # Scratched people mentions & relationship tracker
    ├── services/
    │   ├── authService.ts              # Firebase Auth & Firestore user profile helpers
    │   ├── firebase.ts                 # Firebase initialization with demo placeholder detection
    │   └── journalFirestoreService.ts  # Firestore journal CRUD, subscriptions & demo seeding
    ├── store/
    │   ├── index.ts                    # Redux store configuration (journal, ui, user slices)
    │   ├── hooks.ts                    # Typed useAppDispatch & useAppSelector hooks
    │   └── slices/
    │       ├── journalSlice.ts
    │       ├── uiSlice.ts
    │       └── userSlice.ts
    ├── types/
    │   └── index.ts                    # Shared domain types (JournalEntry, PolaroidData, etc.)
    └── utils/
        ├── entryDates.ts               # Shared date-key resolution, preview cleaning & streak math
        └── nameExtractor.ts            # Person & kinship extraction from journal entries
```

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase (Optional)

Copy `.env.example` to `.env` and fill in your Firebase Web App credentials:

```bash
cp .env.example .env
```

Required environment variables (prefixed with `EXPO_PUBLIC_` for Expo):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

If `.env` is not configured, the app detects the fallback configuration via `isCustomFirebaseConfigured()` (`src/services/firebase.ts`) and offers **Demo Mode** during sign-in/sign-up so you can explore the app locally without a Firebase project.

### 3. Run the App

```bash
npm start            # Start Expo development server
npm run android      # Launch on Android emulator / device
npm run ios          # Launch on iOS simulator / device
npm run web          # Launch in browser
```

---

## Checks & Linting

```bash
npm run lint         # Run Expo ESLint checks (expo lint)
npx tsc --noEmit     # Run TypeScript typechecking
```

