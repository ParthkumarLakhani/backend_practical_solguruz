# Wallet & Transfers API

Express + TypeScript (strict) + PostgreSQL + TypeORM. Accounts, an immutable ledger, and atomic transfers.

## Setup

```bash
nvm use                  # Node 20
npm install
cp .env.example .env
docker compose up -d     # wait until "healthy" in `docker compose ps`
npm run migration:run
npm run dev              # http://localhost:3000
npm test                 # uses the wallet_test database
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | /accounts | create |
| GET | /accounts/:id | balance |
| POST | /accounts/:id/credit | needs `Idempotency-Key` |
| POST | /accounts/:id/debit | needs `Idempotency-Key` |
| POST | /transfers | needs `Idempotency-Key` |
| GET | /accounts/:id/transactions | cursor pagination, newest first |
| GET | /health | includes DB check |

Amounts are integers in minor units (`50000` = ₹500.00).
Every error has the same shape: `{ code, status, errorCode, message, details }`.