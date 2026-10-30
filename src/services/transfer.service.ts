
import { DataSource } from "typeorm";
import { DataBaseConnections } from "../db/data-source";
import { Account } from "../db/entities/account.entity";
import { Transaction } from "../db/entities/transaction.entity";
import { Transfer } from "../db/entities/transfer.entity";
import type { CreateTransferDto } from "../middleware/transfer.validator";
import { createHash } from "crypto";
import { IdempotencyKey } from "../db/entities/idempotency-key.entity";

export class TransferService {
  private readonly dataSource: DataSource = DataBaseConnections;

  async createTransfer(
    payload: CreateTransferDto,
    idempotencyKey: string,
  ) {
    try {
      const requestHash = createHash("sha256")
        .update(
          JSON.stringify({
            operation: "transfer",
            fromAccountId: payload.fromAccountId,
            toAccountId: payload.toAccountId,
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

        // 3. Lock accounts in a consistent order to reduce deadlock risk.
        const accountRepository = manager.getRepository(Account);

        const accountIds = [
          payload.fromAccountId,
          payload.toAccountId,
        ].sort();

        const lockedAccounts = new Map<string, Account>();

        for (const accountId of accountIds) {
          const account = await accountRepository
            .createQueryBuilder("account")
            .setLock("pessimistic_write")
            .where("account.id = :accountId", { accountId })
            .getOne();

          if (!account) {
            throw new Error("ACCOUNT_NOT_FOUND");
          }

          lockedAccounts.set(accountId, account);
        }

        const source = lockedAccounts.get(payload.fromAccountId);
        const destination = lockedAccounts.get(payload.toAccountId);

        if (!source || !destination) {
          throw new Error("ACCOUNT_NOT_FOUND");
        }

        if (source.currency !== destination.currency) {
          throw new Error("CURRENCY_MISMATCH");
        }

        if (source.balance < payload.amount) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        // 4. Update both account balances.
        source.balance -= payload.amount;
        destination.balance += payload.amount;

        await accountRepository.save([source, destination]);

        // 5. Create debit and credit transactions.
        const transactionRepository = manager.getRepository(Transaction);

        const debitTransaction = transactionRepository.create({
          accountId: source.id,
          type: "DEBIT",
          amount: payload.amount,
          reference: payload.reference,
          balanceAfter: source.balance,
        });

        const creditTransaction = transactionRepository.create({
          accountId: destination.id,
          type: "CREDIT",
          amount: payload.amount,
          reference: payload.reference,
          balanceAfter: destination.balance,
        });

        await transactionRepository.save([
          debitTransaction,
          creditTransaction,
        ]);

        // 6. Create the transfer record.
        const transfer = manager.getRepository(Transfer).create({
          fromAccountId: source.id,
          toAccountId: destination.id,
          amount: payload.amount,
          currency: source.currency,
          reference: payload.reference,
        });

        const savedTransfer = await manager
          .getRepository(Transfer)
          .save(transfer);

        const result = {
          transfer: savedTransfer,
          fromAccount: source,
          toAccount: destination,
        };

        // 7. Convert the result to JSON-compatible data.
        const responseBody = JSON.parse(
          JSON.stringify(result, (_key: string, value: unknown) =>
            typeof value === "bigint" ? value.toString() : value,
          ),
        ) as Record<string, unknown>;

        // 8. Save the original response in the same transaction.
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

}

export const transferService = new TransferService();