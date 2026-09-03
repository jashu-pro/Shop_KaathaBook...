# Shop KhattaBook

> Production requires Supabase. The browser-local fallback is intended only for demos and offline prototyping; it must not be used as the source of truth for real shop data, accounts, or worker access.

Shop KhattaBook is a modern digital ledger (Khata Book) SaaS application designed for Indian shop owners (Kirana stores, clothing shops, medical stores, hardware, electronics, etc.). It replaces traditional paper notebooks used for customer credit (udhaar) management and expands into a complete retail business management platform.

## Key Features

- **Authentication:** Email & Password login/signup, Google OAuth, session restoration, and password recovery.
- **Merchant Onboarding:** Shop details, business type, contact info, GSTIN, PAN, and UPI ID setup.
- **Customer Management:** Credit limits, village groupings, duplicate detection (by phone or name+village), and quick Call/SMS/WhatsApp contact links.
- **Inventory & Stock:** Categories, products, barcode scanning mock, pricing, cost tracking, and low-stock visual alerts.
- **Point of Sale (POS) Sales:** Invoice creation, taxes, discounts, bill receipt photo attachments, and cart building.
- **Payment Collection:** Logs for Cash, PhonePe, GPay, Paytm, and Bank Transfer.
- **Digital Ledger:** Traditional Indian Khata layout (Red Debit vs Green Credit) with derived running balances.
- **Business Reports:** Daily summaries, customer statements, outstanding reports with CSV, Excel, and PDF exports.
- **Offline First:** LocalStorage browser database engine and background sync queue.
- **AI Features:** Voice-to-text transaction entry, mock OCR notebook scanner, fuzzy search, and daily business insights.

## Architecture

- **UI:** React 19, Vite, TypeScript, React Router, Zustand, TanStack React Query, Lucide Icons, Vanilla CSS (Glassmorphism theme).
- **Backend / Database:** Supabase, PostgreSQL, Row Level Security (RLS) policies, database triggers.
- **Repository Pattern:** Decoupled storage abstraction (`RepositoryFactory` with `SupabaseRepository` and `LocalRepository` implementations).

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/jashu-pro/Shop_KaathaBook....git
```
2. Install dependencies:
```bash
npm install
```
3. Run development server:
```bash
npm run dev
```
4. Build for production:
```bash
npm run build
```

## Production setup

1. Create a Supabase project and copy `.env.example` to `.env.local`.
2. Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Do not put the service-role key in the frontend.
3. Run every SQL file in `database/migrations/` in numeric order, including `016_production_finance_and_inventory.sql`.
4. Create the `shop-assets` Storage bucket and add owner-scoped upload/read policies before enabling image uploads. If you keep the current public-URL implementation, configure that bucket as public only for non-sensitive shop logos.
5. Configure Supabase Auth email confirmation, password reset redirect URLs, and the Google provider only if Google sign-in is enabled.
6. Verify a full sale, partial sale, payment, void sale, void payment, stock adjustment, and worker suspension in a staging project before launch.

Financial operations in the Supabase path use database functions so each sale/payment updates its related records together. Do not write directly to `sales`, `payments`, `ledger_entries`, or product stock from external clients.
