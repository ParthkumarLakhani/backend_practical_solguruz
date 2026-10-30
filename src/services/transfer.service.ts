
import { DataSource } from "typeorm";
import { DataBaseConnections } from "../db/data-source";
import { Account } from "../db/entities/account.entity";
import { Transaction } from "../db/entities/transaction.entity";
import { Transfer } from "../db/entities/transfer.entity";
import type { CreateTransferDto } from "../middleware/transfer.validator";

export class TransferService {
  private readonly dataSource: DataSource = DataBaseConnections;

  async createTransfer(
    payload: CreateTransferDto,
    idempotencyKey: string,
  ) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        try {
          const accountRepository = manager.getRepository(Account);

          // Lock accounts in a consistent order to reduce deadlock risk.
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

          source.balance -= payload.amount;
          destination.balance += payload.amount;

          await accountRepository.save([source, destination]);

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

          // TODO: Persist and check idempotencyKey in this transaction.
          // void prevents an unused-parameter warning; it does not implement
          // idempotency.
          void idempotencyKey;

          return {
            transfer: savedTransfer,
            fromAccount: source,
            toAccount: destination,
          };
        } catch (error: unknown) {
          throw error;
        }
      });
    } catch (error: unknown) {
      throw error;
    }
  }
}

export const transferService = new TransferService();