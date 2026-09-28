# Full-Stack Inventory Management System (Cambodian SME Edition)
### Production-Grade Enterprise Platform for Cambodian SMEs (Fashion, Footwear, Electronics & Retail)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-D71F00.svg?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Bakong KHQR](https://img.shields.io/badge/NBC-Bakong_KHQR-E02424.svg?style=flat)](https://bakong.nbc.gov.kh)

A comprehensive, production-ready Full-Stack Inventory Management & POS platform custom-tailored for small and medium enterprises (SMEs) in Cambodia. Built as a real-world SaaS portfolio project supporting English & Khmer bilingual operation, USD ($) & Cambodian Riel (៛) dual currency accounting, Bakong KHQR payments, multi-warehouse stock replenishment, and verifiable financial analytics.

---

## Architecture & System Overview

```mermaid
graph TD
    Client[React 19 + TypeScript + Vite + Tailwind CSS] -->|REST API / JWT| API[FastAPI Backend Engine]
    API -->|ORM Transactions| DB[(SQLite / PostgreSQL Engine)]
    API -->|Audit Trail| Audit[Audit Activity Ledger]
    API -->|Stock Movements| Movements[Atomic Stock Ledger]
    
    subgraph Core Modules
        Auth[JWT Role-Based Auth]
        Inv[Multi-Warehouse Stock Engine]
        Purch[PO & Receiving Workflow]
        Sale[POS & Bakong KHQR Engine]
        Fin[COGS & Net Profit Engine]
        Rep[Reporting & CSV Export]
    end
    
    API --> Core Modules
```

---

## Key Business Capabilities

1. **Cambodian SME Localization:**
   - **Bilingual Interface:** Instant runtime switching between English and Khmer (ភាសាខ្មែរ) with dedicated localization dictionaries and Google Fonts (`Kantumruy Pro` & `Inter`).
   - **USD ($) & KHR (៛) Dual Currency Engine:** Live conversion with configurable exchange rate (default 4,100 KHR per 1 USD) across checkout, product catalog, invoices, and analytics.
   - **National Bank of Cambodia (NBC) Bakong KHQR:** Integrated KHQR checkout modal featuring Bakong QR styling, dual currency summary, merchant identification, and verified reference logging.
   - **Cambodian Provinces Directory:** Pre-loaded with all 25 provinces/municipalities (Phnom Penh, Siem Reap, Battambang, Kandal, Preah Sihanouk, Kampot, etc.).

2. **Multi-Warehouse Inventory & Traceable Movements:**
   - Track product and variant stock across multiple depots simultaneously.
   - Stock Status Indicators: `In Stock`, `Low Stock`, `Out of Stock`, and `Overstock`.
   - **Atomic Stock Movements Ledger:** Every stock change (Purchase, Sale, Purchase Return, Sale Return, Stock Adjustment, Transfer In, Transfer Out, Opening Stock) is recorded with `before_quantity`, `after_quantity`, user actor, reference number, and audit note.
   - **Stock Adjustments & Inter-Warehouse Transfers:** Physical count discrepancy reconciliation and multi-step transfer workflow.

3. **Purchasing & Goods Receiving:**
   - Supplier directory with tax registration and payment terms (`Net 30`, `Net 15`, `Cash on Delivery`).
   - Purchase order lifecycle: `Draft` ➔ `Ordered` ➔ `Partially Received` ➔ `Received` ➔ `Cancelled`.
   - Idempotent stock intake: Receiving goods updates inventory and logs stock movements atomically.
   - Supplier returns with stock decrement.

4. **Point of Sale (POS) & Billing:**
   - Fast item search, category filtering, real-time stock validation, and live cart adjustments.
   - Multiple tender types: Cash, Bakong KHQR, Bank Transfer (ABA/Wing/Acleda), and Card.
   - Atomic database transactions preventing race conditions or partial stock decrements.
   - Tax Invoice Generator: Bilingual, printable commercial receipts with dual USD/KHR amounts.

5. **Finance, COGS & Net Profit Accounting:**
   - Historical cost snapshots per sale item to ensure precise Cost of Goods Sold (COGS).
   - Real-time Income Statement (P&L): `Revenue - COGS = Gross Profit`; `Gross Profit - Operating Expenses = Net Profit`.
   - Operating expense tracking by categories: Rent, Electricity, Internet, Salary, Marketing, Packaging, Transportation.
   - Accounts Receivable & Accounts Payable balances.

6. **Executive Dashboard & Business Reports:**
   - Real-time KPI summary cards.
   - Interactive Recharts: 7-day Sales & Profit Trends, Sales by Category Donut, Top 10 Selling Products.
   - Business Reports: Sales, Purchases, Inventory Valuation, and Profit & Loss with instant CSV exports.

7. **Enterprise Security & Audit Trail:**
   - Granular RBAC (Super Admin, Admin/Owner, Store Manager, Sales Staff, Accountant).
   - Secure bcrypt password hashing and signed JWT bearer tokens.
   - Soft-deletion preservation for critical records (`is_deleted=True`).
   - Tamper-evident Audit Log capturing user, action, entity, timestamp, IP, and event description.

---

## Demo Credentials

All test accounts come pre-configured with the seeded company **"Khmer Style Fashion"**:

| Role | Username / Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` / `admin@khmerstyle.com` | `Admin123!` | Complete unrestricted system access |
| **Store Manager** | `manager` / `manager@khmerstyle.com` | `Manager123!` | Products, stock, POs, sales, and reports |
| **Sales Staff** | `staff` / `staff@khmerstyle.com` | `Staff123!` | POS checkout, product viewing, invoices |
| **Accountant** | `accountant` / `accountant@khmerstyle.com` | `Account123!` | Expenses, payments, P&L, financial reports |

*Quick login buttons are also provided directly on the login screen for 1-click evaluation.*

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/             # RESTful route controllers
│   │   ├── core/            # Config, database engine, security & JWT
│   │   ├── models/          # Normalized SQLAlchemy 2.0 database models
│   │   ├── schemas/         # Pydantic v2 schemas and validation
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest automated test suite
│   ├── seed.py              # Cambodian SME demo database seed script
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container definition
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client with auth interceptors
│   │   ├── components/      # UI components (Modals, Badges, StatCards, KHQR)
│   │   ├── context/         # Auth, Language (i18n), and Currency state
│   │   ├── i18n/            # English and Khmer translation dictionaries
│   │   ├── layouts/         # MainLayout with Sidebar & Header
│   │   ├── pages/           # Dashboard, POS, Products, Inventory, Reports, etc.
│   │   ├── types/           # TypeScript domain definitions
│   │   ├── App.tsx          # Router configuration
│   │   └── main.tsx         # React entrypoint
│   ├── package.json         # Node dependencies
│   ├── vite.config.ts       # Vite bundler with Tailwind CSS & API proxy
│   └── Dockerfile           # Frontend multi-stage container definition
│
├── docker-compose.yml       # Docker Compose orchestration
├── .env.example             # Complete environment variables reference
└── README.md                # Comprehensive documentation
```

---

## Getting Started Locally

### Prerequisites
- Python 3.11+ (Python 3.13 tested and verified)
- Node.js 18+ (Node.js v24 tested and verified)
- Git

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed realistic Cambodian SME database (creates inventory.db automatically)
python seed.py

# Run backend API server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*Backend Swagger UI will be live at: `http://localhost:8000/docs`*

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start development server
npm run dev
```
*Frontend web application will be live at: `http://localhost:5173`*

---

## Automated Testing

To run the backend test suite verifying authentication, stock decrement invariants, inventory transfer integrity, and business logic:

```bash
cd backend
.\venv\Scripts\python.exe -m pytest -v
```

---

## Docker Deployment

To launch the complete full-stack environment using Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`

---

## Migration from SQLite to PostgreSQL

The codebase utilizes SQLAlchemy 2.0 ORM without database-specific dialect constraints. To migrate to PostgreSQL in production:
1. Update `.env` or container environment variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/sme_inventory
   ```
2. Install the PostgreSQL driver:
   ```bash
   pip install psycopg2-binary
   ```
3. Run `python seed.py` or apply Alembic migrations.

---

## License

Designed and developed for Cambodian SME Retail & Wholesale Business Management. Open for portfolio and commercial usage.
