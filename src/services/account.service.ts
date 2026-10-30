
import { DataSource, EntityManager } from "typeorm";
import { DataBaseConnections } from "../db/data-source";
import { Account } from "../db/entities/account.entity";
import { Transaction } from "../db/entities/transaction.entity";
import type {
  CreateAccountDto,
  MoneyOperationDto,
  PaginationDto,
} from "../middleware/account.validator";
import { IdempotencyKey } from "../db/entities/idempotency-key.entity";
import { createHash } from "crypto";

export class AccountService {
  private readonly dataSource: DataSource = DataBaseConnections;

  async createAccount(payload: CreateAccountDto) {
    try {
      const accountRepository = this.dataSource.getRepository(Account);

      const account = accountRepository.create({
        ownerName: payload.ownerName,
        currency: payload.currency.toUpperCase(),
        balance: 0,
      });

      return await accountRepository.save(account);
    } catch (error: unknown) {
      throw error;
    }
  }

  async getAccount(accountId: string) {
    try {
      const account = await this.dataSource
        .getRepository(Account)
        .findOneBy({ id: accountId });

      if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      return account;
    } catch (error: unknown) {
      throw error;
    }
  }

async creditAccount(
  accountId: string,
  payload: MoneyOperationDto,
  idempotencyKey: string,
) {
  try {
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify({
          operation: "credit",
          accountId,
          amount: payload.amount,
          reference: payload.reference,
        }),
      )
      .digest("hex");

    return await this.dataSource.transaction(async (manager) => {
      const idempotencyRepository =
        manager.getRepository(IdempotencyKey);

      // 1. Try to create an idempotency record.
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(IdempotencyKey)
        .values({
          key: idempotencyKey,
          requestHash,
          responseStatus: null,
          responseBody: null,
        })
        .orIgnore()
        .returning(["key"])
        .execute();

      const inserted =
        Array.isArray(insertResult.raw) &&
        insertResult.raw.length > 0;

      // 2. If the key already exists, validate the request.
      if (!inserted) {
        const existing = await idempotencyRepository.findOneBy({
          key: idempotencyKey,
        });

        if (!existing) {
          throw new Error("IDEMPOTENCY_RECORD_NOT_FOUND");
        }

        if (existing.requestHash !== requestHash) {
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        }

        if (
          existing.responseStatus === null ||
          existing.responseBody === null
        ) {
          throw new Error("IDEMPOTENCY_RESULT_NOT_AVAILABLE");
        }

        return {
          statusCode: existing.responseStatus,
          data: existing.responseBody,
          replayed: true,
        };
      }

      // 3. Run your existing credit logic.
      const account = await this.getLockedAccount(
        manager,
        accountId,
      );

      account.balance = account.balance + payload.amount;

      await manager.getRepository(Account).save(account);

      const transaction = manager
        .getRepository(Transaction)
        .create({
          accountId,
          type: "CREDIT",
          amount: payload.amount,
          reference: payload.reference,
          balanceAfter: account.balance,
        });

      await manager.getRepository(Transaction).save(transaction);

      const result = { account, transaction };

      // 4. Convert the result to JSON-compatible data.
      const responseBody = JSON.parse(
        JSON.stringify(result, (_key: string, value: unknown) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      ) as Record<string, unknown>;

      // 5. Save the original response in the same transaction.
      const idempotencyRecord = await idempotencyRepository.findOneBy({
        key: idempotencyKey,
      });

      if (!idempotencyRecord) {
        throw new Error("IDEMPOTENCY_RECORD_NOT_FOUND");
      }

      idempotencyRecord.responseStatus = 200;
      idempotencyRecord.responseBody = responseBody;

      await idempotencyRepository.save(idempotencyRecord);

      return {
        statusCode: 200,
        data: responseBody,
        replayed: false,
      };
    });
  } catch (error: unknown) {
    throw error;
  }
}


async debitAccount(
  accountId: string,
  payload: MoneyOperationDto,
  idempotencyKey: string,
) {
  try {
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify({
          operation: "debit",
          accountId,
          amount: payload.amount,
          reference: payload.reference,
        }),
      )
      .digest("hex");

    return await this.dataSource.transaction(async (manager) => {
      const idempotencyRepository =
        manager.getRepository(IdempotencyKey);

      // 1. Try to create an idempotency record.
      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(IdempotencyKey)
        .values({
          key: idempotencyKey,
          requestHash,
          responseStatus: null,
          responseBody: null,
        })
        .orIgnore()
        .returning(["key"])
        .execute();

      const inserted =
        Array.isArray(insertResult.raw) &&
        insertResult.raw.length > 0;

      // 2. If the key already exists, validate the request.
      if (!inserted) {
        const existing = await idempotencyRepository.findOneBy({
          key: idempotencyKey,
        });

        if (!existing) {
          throw new Error("IDEMPOTENCY_RECORD_NOT_FOUND");
        }

        if (existing.requestHash !== requestHash) {
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        }

        if (
          existing.responseStatus === null ||
          existing.responseBody === null
        ) {
          throw new Error("IDEMPOTENCY_RESULT_NOT_AVAILABLE");
        }

        return {
          statusCode: existing.responseStatus,
          data: existing.responseBody,
          replayed: true,
        };
      }

      // 3. Run your existing debit logic.
      const account = await this.getLockedAccount(
        manager,
        accountId,
      );

      if (account.balance < payload.amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      account.balance -= payload.amount;

      await manager.getRepository(Account).save(account);

      const transaction = manager
        .getRepository(Transaction)
        .create({
          accountId,
          type: "DEBIT",
          amount: payload.amount,
          reference: payload.reference,
          balanceAfter: account.balance,
        });

      await manager.getRepository(Transaction).save(transaction);

      const result = { account, transaction };

      // 4. Convert the result to JSON-compatible data.
      const responseBody = JSON.parse(
        JSON.stringify(result, (_key: string, value: unknown) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      ) as Record<string, unknown>;

      // 5. Save the original response in the same transaction.
      const idempotencyRecord = await idempotencyRepository.findOneBy({
        key: idempotencyKey,
      });

      if (!idempotencyRecord) {
        throw new Error("IDEMPOTENCY_RECORD_NOT_FOUND");
      }

      idempotencyRecord.responseStatus = 200;
      idempotencyRecord.responseBody = responseBody;

      await idempotencyRepository.save(idempotencyRecord);

      return {
        statusCode: 200,
        data: responseBody,
        replayed: false,
      };
    });
  } catch (error: unknown) {
    throw error;
  }
}

  async getAccountTransactions(
    accountId: string,
    pagination: PaginationDto,
  ) {
    try {
      await this.getAccount(accountId);

      const [transactions, total] = await this.dataSource
        .getRepository(Transaction)
        .findAndCount({
          where: { accountId },
          order: { createdAt: "DESC" },
          take: pagination.limit,
          skip: pagination.offset,
        });

      return {
        transactions,
        pagination: {
          limit: pagination.limit,
          offset: pagination.offset,
          total,
        },
      };
    } catch (error: unknown) {
      throw error;
    }
  }

  private async getLockedAccount(
    manager: EntityManager,
    accountId: string,
  ): Promise<Account> {
    try {
      const account = await manager
        .getRepository(Account)
        .createQueryBuilder("account")
        .setLock("pessimistic_write")
        .where("account.id = :accountId", { accountId })
        .getOne();

      if (!account) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }

      return account;
    } catch (error: unknown) {
      throw error;
    }
  }
}

export const accountService = new AccountService();
