# backend_practical_solguruz
Integration of a payment module with solguruz 


# wallet-api/
# ├── docker-compose.yml
# ├── .env.example
# ├── .gitignore
# ├── package.json
# ├── tsconfig.json              # "strict": true
# ├── jest.config.ts
# ├── README.md
# ├── src/
# │   ├── server.ts              # boots DB + listens
# │   ├── app.ts                 # builds Express app (importable by tests)
# │   ├── config/
# │   │   └── env.ts             # parse + validate env vars
# │   ├── db/
# │   │   ├── data-source.ts     # TypeORM DataSource (synchronize: false)
# │   │   ├── entities/
# │   │   │   ├── account.entity.ts
# │   │   │   ├── transaction.entity.ts
# │   │   │   ├── transfer.entity.ts
# │   │   │   └── idempotency-key.entity.ts
# │   │   └── migrations/
# │   │       ├── 1700000000000-CreateAccounts.ts
# │   │       ├── 1700000000001-CreateTransfersAndTransactions.ts
# │   │       └── 1700000000002-CreateIdempotencyKeys.ts
# │   ├── modules/
# │   │   ├── accounts/
# │   │   │   ├── accounts.routes.ts       # HTTP only
# │   │   │   ├── accounts.schemas.ts      # zod schemas
# │   │   │   ├── accounts.service.ts      # business logic + transaction boundary
# │   │   │   └── accounts.repository.ts   # SQL / data access
# │   │   ├── transfers/
# │   │   │   ├── transfers.routes.ts
# │   │   │   ├── transfers.schemas.ts
# │   │   │   └── transfers.service.ts
# │   │   └── health/health.routes.ts
# │   ├── common/
# │   │   ├── errors.ts                    # AppError subclasses
# │   │   ├── error-handler.ts             # single error middleware
# │   │   ├── validate.ts                  # zod middleware
# │   │   ├── idempotency.ts               # runIdempotent() helper
# │   │   └── money.ts                     # amount helpers
# │   └── types/
# └── test/
#     ├── setup.ts                         # connect, run migrations, truncate between tests
#     ├── concurrency.test.ts
#     ├── idempotency.test.ts
#     ├── transfers.test.ts
#     └── validation.test.ts