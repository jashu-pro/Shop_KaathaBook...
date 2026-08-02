# Shop KhattaBook

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
