import { DataSource, EntityManager } from "typeorm";
import { DataBaseConnections } from "../db/data-source";
import { Account } from "../db/entities/account.entity";
import { Transaction } from "../db/entities/transaction.entity";
import type {
  CreateAccountDto,
  MoneyOperationDto,
  PaginationDto,
} from "../middleware/account.validator";

export class AccountService {
  private readonly dataSource: DataSource = DataBaseConnections;

  async createAccount(payload: CreateAccountDto) {
    const accountRepository = this.dataSource.getRepository(Account);

    const account = accountRepository.create({
      ownerName: payload.ownerName,
      currency: payload.currency.toUpperCase(),
      balance: 0,
    });

    return accountRepository.save(account);
  }

  async getAccount(accountId: string) {
    const account = await this.dataSource
      .getRepository(Account)
      .findOneBy({ id: accountId });

    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    return account;
  }

  async creditAccount(
    accountId: string,
    payload: MoneyOperationDto,
    idempotencyKey: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const account = await this.getLockedAccount(manager, accountId);

      account.balance =  account.balance + payload.amount;
      await manager.getRepository(Account).save(account);

      const transaction = manager.getRepository(Transaction).create({
        accountId,
        type: "CREDIT",
        amount: payload.amount,
        reference: payload.reference,
        balanceAfter: account.balance,
      });

      await manager.getRepository(Transaction).save(transaction);

      // TODO: Persist and check the idempotency key in this transaction.
      // Do not consider this operation idempotent until that is implemented.
      void idempotencyKey;

      return { account, transaction };
    });
  }

  async debitAccount(
    accountId: string,
    payload: MoneyOperationDto,
    idempotencyKey: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const account = await this.getLockedAccount(manager, accountId);

      if (account.balance < payload.amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      account.balance -= payload.amount;
      await manager.getRepository(Account).save(account);

      const transaction = manager.getRepository(Transaction).create({
        accountId,
        type: "DEBIT",
        amount: payload.amount,
        reference: payload.reference,
        balanceAfter: account.balance,
      });

      await manager.getRepository(Transaction).save(transaction);

      // TODO: Persist and check the idempotency key in this transaction.
      void idempotencyKey;

      return { account, transaction };
    });
  }

  async getAccountTransactions(
    accountId: string,
    pagination: PaginationDto,
  ) {
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
  }

  private async getLockedAccount(
    manager: EntityManager,
    accountId: string,
  ): Promise<Account> {
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
  }
}

export const accountService = new AccountService();