# Scope Frontend Web — React PWA
## Expense Tracker App

> Stack: ReactJS + Vite PWA | Konsumsi: Express REST API | Auth: JWT + Firebase Google Login

---

## Tech Stack & Dependencies Utama

| Package | Kegunaan |
|--------|----------|
| `vite` + `vite-plugin-pwa` | Build tool + PWA support |
| `react-router-dom` | Client-side routing |
| `axios` | HTTP client ke backend |
| `firebase` | Google Sign-In (client-side) |
| `zustand` atau `context API` | State management |
| `react-hook-form` | Form handling |
| `dayjs` | Manipulasi tanggal |
| `react-hot-toast` | Notifikasi / toast |
| `workbox` (via vite-plugin-pwa) | Service worker + caching |

---

## Struktur Folder

```
src/
├── assets/                  # Ikon, gambar, manifest icons
├── components/
│   ├── ui/                  # Komponen reusable (Button, Input, Modal, Badge)
│   ├── layout/              # Navbar, Sidebar, PageWrapper
│   └── shared/              # TransactionCard, BudgetBar, CategoryBadge
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   ├── transactions/
│   │   ├── TransactionListPage.jsx
│   │   ├── TransactionFormPage.jsx  # Add & Edit
│   │   └── TransactionDetailPage.jsx
│   ├── budget/
│   │   ├── BudgetListPage.jsx
│   │   └── BudgetFormPage.jsx
│   └── NotFoundPage.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useTransactions.js
│   └── useBudget.js
├── services/
│   ├── api.js               # Axios instance + interceptor JWT
│   ├── authService.js
│   ├── transactionService.js
│   ├── budgetService.js
│   └── categoryService.js
├── store/                   # Zustand stores (atau Context)
│   ├── authStore.js
│   └── transactionStore.js
├── utils/
│   ├── budgetCalculator.js  # Logika carry over realtime
│   ├── dateHelpers.js       # Working days, weekend check
│   └── formatCurrency.js
├── firebase.config.js
├── App.jsx
└── main.jsx
```

---

## Halaman & Fitur Detail

### 1. Auth

#### Login Page (`/login`)
- Form email + password
- Tombol **Login dengan Google** (Firebase)
- Link ke Register
- Redirect ke Dashboard jika sudah login
- Validasi form (react-hook-form)

#### Register Page (`/register`)
- Form: nama, email, password, konfirmasi password
- Tombol **Daftar dengan Google** (Firebase)
- Link ke Login
- Validasi form

**Flow Firebase Login:**
```
User klik Google
→ signInWithPopup()
→ getIdToken()
→ POST /api/auth/google { idToken }
→ Simpan JWT ke localStorage
→ Redirect ke Dashboard
```

---

### 2. Dashboard (`/`)

**Summary Cards:**
- Total Saldo (income - expense)
- Total Pemasukan bulan ini
- Total Pengeluaran bulan ini

**Budget Hari Ini** (per budget period aktif):
- Nama budget period
- Budget efektif hari ini (base + carry over)
- Total pengeluaran hari ini
- Sisa / surplus / deficit
- Progress bar visual (hijau = surplus, merah = deficit)

**Transaksi Terbaru:**
- List 5 transaksi terakhir
- Link "Lihat Semua"

---

### 3. Transaksi

#### List Transaksi (`/transactions`)
- Tabel / list semua transaksi
- Filter:
  - Tanggal (date range picker)
  - Tipe: All / Income / Expense
  - Kategori
- Tombol Tambah Transaksi
- Aksi per row: Edit | Hapus (konfirmasi modal)
- Pagination atau infinite scroll

#### Form Transaksi (`/transactions/new` dan `/transactions/:id/edit`)
- Field:
  - Tipe (Income / Expense) — toggle
  - Nominal (Rp)
  - Kategori (dropdown dari API)
  - Catatan (textarea)
  - Tanggal (date picker, default hari ini)
  - Budget Period (dropdown, opsional)
  - Lokasi (tombol "Ambil Lokasi Saya" — opsional, geolocation API)
- Submit → POST atau PUT ke API

#### Detail Transaksi (`/transactions/:id`)
- Semua field transaksi
- Tampilkan lokasi jika ada (latitude, longitude → link Google Maps)
- Tombol Edit | Hapus

---

### 4. Budget Period (`/budget`)

#### List Budget (`/budget`)
- Kartu per budget period:
  - Nama, periode (start – end)
  - Total budget
  - Budget harian base
  - Jumlah hari kerja
  - Status: Aktif / Selesai
- Tombol Tambah Budget

#### Form Budget (`/budget/new` dan `/budget/:id/edit`)
- Field:
  - Nama budget (misal "Budget Maret–April")
  - Total budget (Rp)
  - Tanggal mulai
  - Tanggal selesai
  - Kategori terkait (opsional, null = global)
- Preview otomatis:
  - Jumlah hari kerja (hitung realtime saat input tanggal)
  - Budget harian = total ÷ hari kerja

#### Daily Status View (`/budget/:id/daily`)
- Tabel per hari dalam periode:
  - Tanggal
  - Hari (Senin–Minggu)
  - Budget Base (0 jika weekend)
  - Carry Over
  - Budget Efektif
  - Total Spent
  - Sisa / Surplus / Deficit
- Highlight hari ini
- Warna baris: hijau (surplus), merah (deficit), abu (weekend)

---

### 5. Komponen Reusable Penting

```
<BudgetStatusBar />      — progress bar surplus/deficit
<TransactionCard />      — card transaksi di list & dashboard
<CategoryBadge />        — chip warna per kategori
<CurrencyInput />        — input nominal dengan format Rp
<DateRangePicker />      — filter tanggal
<ConfirmModal />         — modal konfirmasi hapus
<LocationPicker />       — tombol ambil geolocation
```

---

### 6. PWA Configuration

```javascript
// vite.config.js — vite-plugin-pwa
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'Expense Tracker',
    short_name: 'ExpTrack',
    theme_color: '#1a1a2e',
    icons: [ /* 192x192, 512x512 */ ]
  },
  workbox: {
    runtimeCaching: [
      // Cache API responses (categories, budget periods)
    ]
  }
})
```

**PWA Features:**
- Installable (Add to Home Screen)
- Offline fallback page
- Cache static assets via service worker
- Web Push Notification (reminder jam 20:00)

---

### 7. Notifikasi Web Push (Bonus)

```
Flow:
1. User izinkan notifikasi (Notification.requestPermission)
2. Subscribe ke push service → dapat subscription object
3. Kirim subscription ke backend → POST /api/notifications/subscribe
4. Backend jadwalkan push jam 20:00 via node-cron + web-push
5. Service worker handle notifikasi masuk
```

---

### 8. Axios Interceptor & Auth

```javascript
// services/api.js
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL })

// Request interceptor — inject JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

---

## Routing Structure

```
/login                        → LoginPage (public)
/register                     → RegisterPage (public)

/ (PrivateRoute)
├── /                         → DashboardPage
├── /transactions             → TransactionListPage
├── /transactions/new         → TransactionFormPage
├── /transactions/:id         → TransactionDetailPage
├── /transactions/:id/edit    → TransactionFormPage
├── /budget                   → BudgetListPage
├── /budget/new               → BudgetFormPage
├── /budget/:id/edit          → BudgetFormPage
└── /budget/:id/daily         → BudgetDailyPage
```

---

## Logika Carry Over (Frontend Utility)

```javascript
// utils/budgetCalculator.js

export function isWeekend(date) {
  const day = dayjs(date).day() // 0=Sun, 6=Sat
  return day === 0 || day === 6
}

export function getWorkingDays(startDate, endDate) {
  let count = 0
  let current = dayjs(startDate)
  const end = dayjs(endDate)
  while (current.isBefore(end) || current.isSame(end)) {
    if (!isWeekend(current)) count++
    current = current.add(1, 'day')
  }
  return count
}

export function getDailyStatus(budgetPeriod, transactions, targetDate) {
  const dailyBase = budgetPeriod.daily_budget_base
  let carryOver = 0

  let current = dayjs(budgetPeriod.start_date)
  const target = dayjs(targetDate)

  while (current.isBefore(target) || current.isSame(target, 'day')) {
    const base = isWeekend(current) ? 0 : dailyBase
    const effectiveBudget = base + carryOver
    const spent = transactions
      .filter(t => dayjs(t.date).isSame(current, 'day') && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    carryOver = effectiveBudget - spent
    current = current.add(1, 'day')
  }

  const todayBase = isWeekend(targetDate) ? 0 : dailyBase
  // carryOver sekarang = sisa setelah hari targetDate
  // Untuk budget efektif hari ini, ambil carry sebelum hari ini
  return {
    effectiveBudget: todayBase + (carryOver + /* spent today */0),
    // hitung ulang untuk tampilan...
  }
}
```

> Catatan: Kalau logika ini sudah di-handle backend via `GET /api/budget-periods/:id/daily-status`, frontend cukup consume endpoint tersebut. Utility ini sebagai fallback / offline support.

---

## Environment Variables

```env
VITE_API_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

---

## Prioritas Pengerjaan (Urutan Recommended)

| Prioritas | Task |
|-----------|------|
| 🔴 P1 | Setup Vite + PWA + Routing + Axios |
| 🔴 P1 | Auth (Login, Register, Google Login, Protected Route) |
| 🔴 P1 | Dashboard (summary cards + transaksi terbaru) |
| 🔴 P1 | CRUD Transaksi (list, form, hapus) |
| 🟡 P2 | Budget Period (list, form, daily view) |
| 🟡 P2 | Filter transaksi (tanggal, tipe, kategori) |
| 🟡 P2 | Detail transaksi + tampil lokasi |
| 🟢 P3 | PWA install prompt + offline fallback |
| 🟢 P3 | Web Push Notification (bonus) |
| 🟢 P3 | Geolocation input (bonus) |

---

*Dokumen ini adalah scope frontend PWA ReactJS untuk project Expense Tracker.*
*Backend: Express.js | Mobile: Flutter*