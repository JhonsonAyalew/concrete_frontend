Concrete Ethiopia — Frontend

<div align="center">

![EquipRent Ethiopia](https://img.shields.io/badge/EquipRent-Ethiopia-f97316?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-Private-red?style=for-the-badge)

**Ethiopia's #1 Heavy Equipment Rental Platform**

A full-featured, production-ready React frontend for connecting equipment owners with businesses across Ethiopia. Supports four distinct user roles, bilingual UI (English & Amharic), dark/light mode, and full REST API integration.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Integration](#api-integration)
- [Theming & Customization](#theming--customization)
- [Internationalization](#internationalization)
- [Role-Based Access](#role-based-access)
- [Component Library](#component-library)
- [Scripts](#scripts)

---

## Overview

Concrete Ethiopia is a digital marketplace that bridges equipment owners and construction businesses. The frontend is built as a **React + Vite** single-page application styled entirely with **Tailwind CSS**. It connects to a Node.js/Express backend via a RESTful API and supports:

- Public equipment browsing without login
- Customer booking and rental management
- Owner equipment listing and earnings analytics
- Admin full platform control with charts and reports
- Superadmin administrator management

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React 18.3 |
| Build Tool | Vite 5.4 |
| Styling | Tailwind CSS 3.4 |
| Routing | React Router DOM v6 |
| State Management | React Context API + Zustand |
| Server State | React Query v3 |
| Forms | React Hook Form |
| HTTP Client | Axios (with interceptors + auto token refresh) |
| Charts | Recharts |
| Animations | Framer Motion |
| Internationalization | i18next + react-i18next |
| Date Utilities | date-fns |
| File Upload | react-dropzone |
| Notifications | react-hot-toast |
| Icons | Lucide React |

---

## Features

### General
- ⚡ **Vite** — lightning-fast dev server and build
- 🌙 **Dark / Light Mode** — persisted to localStorage, respects OS preference
- 🌍 **Bilingual** — English and Amharic (አማርኛ), switchable at runtime
- 📱 **Fully Responsive** — mobile-first, collapsible sidebar on small screens
- 🔔 **Real-time Notifications** — bell dropdown, auto-polls every 30 seconds
- 🛡️ **Role-based Guards** — routes protected per user role
- 🔄 **Auto Token Refresh** — silent JWT refresh on 401 responses
- 🎨 **Single-file Theme System** — change entire brand color in two files

### Public
- Landing page with hero, categories, how-it-works, featured listings, trust section, and CTA
- Equipment search with filter panel (category, city, condition, price range, sort)
- Equipment detail with image gallery, tabs (overview, specs, reviews, time slots), and booking CTA
- About and Contact pages

### Admin
- Dashboard with live KPI cards, revenue bar chart, booking trend line chart, booking status pie chart, category breakdown
- Equipment management with full CRUD
- Category management with emoji icons
- Submission review — approve with note / reject with reason
- Booking management — confirm, complete, cancel
- Customer and Owner management — view profiles, suspend/activate
- Revenue and booking trend reports with month selector
- Time Slot manager — per-equipment shift scheduling with optional price override
- Platform settings — commission rate, maintenance mode, platform name
- Administrator management (superadmin only)

### Owner
- Dashboard with earnings cards and monthly revenue chart
- 5-step Add Equipment form — basic info, details + specs, pricing, location, media upload
- Submission tracker with admin notes and rejection reasons
- Booking management — confirm or cancel, view customer details
- Availability calendar with booked date highlights
- Analytics — revenue trend, per-equipment performance table
- Profile and payout settings

### Customer
- Dashboard with booking stat cards and recent booking list
- Equipment search (links to public search page)
- Book Equipment — pricing mode selector, date picker, time slot selector, live price calculator (total, platform fee, deposit)
- Booking history with status tabs and cancellation
- Leave review with star rating (for completed bookings)
- Profile with ID verification prompt

---

## Project Structure

```
src/
├── assets/                  # Static assets (images, icons)
│
├── components/
│   ├── common/
│   │   ├── PublicNavbar.jsx     # Top nav for public pages
│   │   ├── DashboardNavbar.jsx  # Top bar for all dashboards (notifications, user menu)
│   │   └── Sidebar.jsx          # Collapsible sidebar (admin / owner / customer)
│   └── ui/
│       └── index.jsx            # All reusable UI components (Button, Input, Modal, Table…)
│
├── context/
│   ├── AuthContext.jsx          # User auth state, login/logout, token management
│   ├── ThemeContext.jsx         # Dark/light mode toggle
│   └── NotificationContext.jsx  # Notification polling and state
│
├── layouts/
│   ├── PublicLayout.jsx         # Wraps public pages with navbar + footer
│   ├── AdminLayout.jsx          # Wraps admin pages with sidebar + top bar
│   ├── OwnerLayout.jsx          # Wraps owner pages
│   └── CustomerLayout.jsx       # Wraps customer pages
│
├── locales/
│   ├── en.json                  # English translations
│   └── am.json                  # Amharic translations
│
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx     # 3-step: role → details → ID verify
│   │   ├── ForgotPasswordPage.jsx
│   │   └── ResetPasswordPage.jsx
│   │
│   ├── public/
│   │   ├── LandingPage.jsx
│   │   ├── SearchPage.jsx
│   │   ├── EquipmentDetailPage.jsx
│   │   ├── AboutPage.jsx
│   │   └── ContactPage.jsx
│   │
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminEquipment.jsx
│   │   ├── AdminCategories.jsx
│   │   ├── AdminSubmissions.jsx
│   │   ├── AdminBookings.jsx
│   │   ├── AdminCustomers.jsx
│   │   ├── AdminOwners.jsx
│   │   ├── AdminReports.jsx
│   │   ├── AdminTimeSlots.jsx
│   │   ├── AdminSettings.jsx
│   │   ├── AdminAdmins.jsx      # Superadmin only
│   │   └── AdminProfile.jsx
│   │
│   ├── owner/
│   │   ├── OwnerDashboard.jsx
│   │   ├── OwnerAddEquipment.jsx
│   │   ├── OwnerMySubmissions.jsx
│   │   ├── OwnerBookings.jsx
│   │   ├── OwnerCalendar.jsx
│   │   ├── OwnerAnalytics.jsx
│   │   ├── OwnerProfile.jsx
│   │   └── OwnerSettings.jsx
│   │
│   ├── customer/
│   │   ├── CustomerDashboard.jsx
│   │   ├── BookEquipmentPage.jsx
│   │   ├── CustomerBookings.jsx
│   │   └── CustomerProfile.jsx
│   │
│   └── superadmin/
│       └── SuperAdminPage.jsx
│
├── router/
│   └── index.jsx                # All routes with role guards
│
├── services/
│   ├── api.js                   # Axios instance with request/response interceptors
│   ├── authService.js           # Auth endpoints
│   ├── equipmentService.js      # Equipment + time slot endpoints
│   └── index.js                 # All other services (bookings, submissions, users…)
│
├── App.jsx
├── main.jsx                     # App entry — providers, router, toaster
├── i18n.js                      # i18next configuration
└── index.css                    # Tailwind directives + full design system (CSS variables)
```

---

## Pages & Routes

| Path | Page | Access |
|---|---|---|
| `/` | Landing Page | Public |
| `/equipment` | Equipment Search | Public |
| `/equipment/:id` | Equipment Detail | Public |
| `/about` | About | Public |
| `/contact` | Contact | Public |
| `/login` | Login | Guest only |
| `/register` | Register | Guest only |
| `/forgot-password` | Forgot Password | Guest only |
| `/reset-password?token=…` | Reset Password | Guest only |
| `/admin` | Admin Dashboard | admin, superadmin |
| `/admin/equipment` | Equipment Management | admin, superadmin |
| `/admin/categories` | Category Management | admin, superadmin |
| `/admin/submissions` | Submission Review | admin, superadmin |
| `/admin/bookings` | Booking Management | admin, superadmin |
| `/admin/customers` | Customer Management | admin, superadmin |
| `/admin/owners` | Owner Management | admin, superadmin |
| `/admin/reports` | Reports & Analytics | admin, superadmin |
| `/admin/time-slots` | Time Slot Control | admin, superadmin |
| `/admin/settings` | Platform Settings | admin, superadmin |
| `/admin/admins` | Admin Management | superadmin only |
| `/admin/profile` | Admin Profile | admin, superadmin |
| `/owner` | Owner Dashboard | owner |
| `/owner/add-equipment` | Add Equipment | owner |
| `/owner/submissions` | My Submissions | owner |
| `/owner/bookings` | Owner Bookings | owner |
| `/owner/calendar` | Availability Calendar | owner |
| `/owner/analytics` | Owner Analytics | owner |
| `/owner/profile` | Owner Profile | owner |
| `/owner/settings` | Owner Settings | owner |
| `/customer` | Customer Dashboard | customer |
| `/customer/book/:id` | Book Equipment | customer |
| `/customer/bookings` | My Bookings | customer |
| `/customer/profile` | Customer Profile | customer |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- Backend API running at `http://localhost:5000` (or configure via `.env`)

### Installation

```bash
# 1. Extract the zip and enter the project folder
cd Concrete_frontend

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env
# Edit .env and set your API URL (see Environment Variables section)

# 4. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Backend API base URL
VITE_API_URL=http://localhost:5000/api/v1

# Optional: set a different port for the dev server
# VITE_PORT=3000
```

> All environment variables must be prefixed with `VITE_` to be accessible inside the React app.

---

## API Integration

All HTTP calls go through `src/services/api.js` — a configured Axios instance that:

1. Automatically attaches the `Authorization: Bearer <token>` header on every request
2. On a `401` response, silently fetches a new access token using the stored refresh token
3. On refresh failure, clears storage and redirects to `/login`

### Service files

| File | Covers |
|---|---|
| `authService.js` | login, register, logout, refresh, forgot/reset password, verify ID |
| `equipmentService.js` | equipment CRUD, availability check, time slot management |
| `services/index.js` | categories, submissions, bookings, notifications, uploads, reviews, reports, owner analytics, settings, users, admin |

---

## Theming & Customization

### Change the brand color

**Step 1 — `src/index.css`** (CSS variables used at runtime):
```css
:root {
  --brand:      #f97316;  /* primary color */
  --brand-dark: #ea6c0a;  /* hover state   */
  --brand-light:#fed7aa;  /* light tint    */
}
```

**Step 2 — `tailwind.config.js`** (Tailwind utility classes):
```js
brand: {
  500: '#f97316',   /* bg-brand-500, text-brand-500, border-brand-500 */
  600: '#ea580c',   /* hover:bg-brand-600 */
  // ... all shades 50–950
}
```

Change the same hex value in both files and the **entire application** updates — buttons, links, active states, glows, charts, badges.

### Change fonts

1. Update the Google Fonts `<link>` in `index.html`
2. Update `fontFamily.display` and `fontFamily.body` in `tailwind.config.js`

### Dark mode

Dark mode overrides live in the `.dark {}` block in `src/index.css`. Toggle is stored in `localStorage` under the key `theme`.

---

## Internationalization

Translations are in `src/locales/`:

| File | Language |
|---|---|
| `en.json` | English |
| `am.json` | Amharic (አማርኛ) |

**Add a translation key:**
```json
// en.json
{ "myKey": "Hello" }

// am.json
{ "myKey": "ሰላም" }
```

**Use in a component:**
```jsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
return <p>{t('myKey')}</p>;
```

**Switch language programmatically:**
```js
i18n.changeLanguage('am'); // or 'en'
```

---

## Role-Based Access

The application enforces route-level access through the `RequireAuth` guard in `src/router/index.jsx`.

| Role | Dashboard | Can Book | Can List Equipment | Can Approve | Can Manage Platform |
|---|---|---|---|---|---|
| `public` | — | ✗ | ✗ | ✗ | ✗ |
| `customer` | `/customer` | ✅ | ✗ | ✗ | ✗ |
| `owner` | `/owner` | ✗ | ✅ | ✗ | ✗ |
| `admin` | `/admin` | ✗ | ✅ | ✅ | ✅ |
| `superadmin` | `/admin` | ✗ | ✅ | ✅ | ✅ + manage admins |

After login, users are automatically redirected to their role's dashboard.

---

## Component Library

All reusable components live in `src/components/ui/index.jsx`. Import them directly:

```jsx
import {
  Button, Input, Textarea, Select,
  Modal, ConfirmDialog,
  Table, Pagination,
  StatCard, Card,
  StatusBadge, Avatar, Tabs,
  SearchInput, EmptyState,
  StarRating, Spinner, PageLoader,
  SectionHeader, FormRow,
} from '../../components/ui';
```

### Key components

| Component | Description |
|---|---|
| `Button` | Variants: `primary`, `secondary`, `ghost`, `danger`, `success`, `outline`. Sizes: `sm`, `md`, `lg`, `xl`, `icon`. Built-in `loading` spinner. |
| `Input` | Label, error, hint, left icon, right icon, password toggle |
| `Modal` | Overlay modal with title, body, optional footer. Click outside to close. |
| `ConfirmDialog` | Delete/action confirmation with `danger` or `warning` type |
| `Table` | Data table with skeleton loading, empty state, and custom cell renderers |
| `StatCard` | KPI card with icon, value, change percentage |
| `StatusBadge` | Color-coded badge for statuses (pending, confirmed, approved, etc.) |
| `Pagination` | Page number navigator with ellipsis |
| `StarRating` | Interactive or read-only star rating 1–5 |

---

## Scripts

```bash
# Start development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Backend Connection

This frontend is designed to work with the **Concrete Ethiopia Backend** (Node.js + Express + PostgreSQL).

- Base URL: `http://localhost:5000/api/v1`
- All requests require `Authorization: Bearer <token>` except public endpoints
- Tokens are managed automatically — stored in `localStorage`, refreshed on expiry
- See the backend documentation for full endpoint reference

---

## License

This project is proprietary software. All rights reserved.  
© 2025 Concrete Ethiopia. Unauthorized copying, distribution, or modification is prohibited.

---

<div align="center">
  Built with ❤️ for Ethiopia's construction industry
</div>
