# Product Requirements Document (PRD) - Sistem Operasional UMKM (SaaS)

## 1. Project Overview
A complete multi-tenant SaaS application to help MSMEs (e.g., laundry, repair shops, retail stores) manage their daily operations. Features include customer management, POS, inventory, WhatsApp notifications, subscription billing via Midtrans, and analytical dashboards.

- Theme: Dark Mode Modern
- Primari Owner Account: `muhamad.widiono98@gmail.com`
- Tech Stack: FastAPI + React + MongoDB

## 2. Target Persona
- **MSME Owner**: Wants a clear dashboard of sales, stock alerts, and automated notifications for customers.
- **MSME Staff**: Wants a fast and mobile-friendly POS system to record sales, manage inventory, and generate receipts.
- **Super Admin**: Wants a comprehensive view of SaaS growth, active tenants, subscriptions, and logs.

## 3. Core Requirements & Implementation Status
### Phase 1: Foundations
- [x] MongoDB database schema with strict multi-tenant isolation (`tenant_id`).
- [x] Multi-tenant role-based access control (Super Admin, Owner, Staff).
- [x] Custom JWT Authentication & Emergent Google Social Login.
- [x] Seeding muhamad.widiono98@gmail.com as the primary Owner. (Date: August 28, 2026)

### Phase 2: Core Business
- [x] Customers Module (CRUD) with detailed histories.
- [x] Products Module (CRUD) with unit types and stock attributes.
- [x] POS Terminal: Multi-item sales, discounts, taxes, and custom payments (Cash, QRIS, Kasbon).
- [x] Automatic Invoice ID generator (INV-YYYYMMDD-XXXX).

### Phase 3: Inventory (Pro)
- [x] Automatic stock deduction and mutation logging on sale.
- [x] Critical/low stock threshold warnings.

### Phase 4: Notifications (Pro)
- [x] WhatsApp message template dispatch (Receipt, Invoice, Due Reminder).
- [x] Interactive WhatsApp simulation console for demonstration.

### Phase 5: Billing & Subscription
- [x] Midtrans SDK/Client integration or secure mock payment screen.
- [x] Feature gating and transaction limits based on tier (Gratis, Basic, Pro).

### Phase 6: Super Admin & Polish
- [x] Super Admin metrics.
- [x] High-density Bento Grid dashboard with Dark Mode Modern theme.

## 4. Testing & Quality Assurance (Date: August 28, 2026)
- Backend test suite: `pytest` passed 11/11 tests.
- E2E Playwright verified:
  - Custom Login and Google OAuth session surviving page reloads (survives 100%).
  - Safe unauthenticated root `/` access with no transient error toasts.
  - Correct hiding of Basic packages on the billing page for Pro tenants.
  - Multi-tenant data segregation (fully isolated).

## 5. Prioritized Backlog
- **P0**: Custom PDF export for receipt printing.
- **P1**: Direct click-to-WhatsApp backup dispatch links.
- **P2**: Custom domain mapping for Pro tenants.
