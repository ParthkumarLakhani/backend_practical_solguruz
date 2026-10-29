
import type { RequestHandler } from "express";
import ResponseUtil from "../utils/response";
import {
  AccountValidator,
  type CreateAccountDto,
  type MoneyOperationDto,
  type PaginationDto,
} from "../middleware/account.validator";
import { AccountService } from "../services/account.service";

export class AccountController {
  private readonly accountService: AccountService;

  constructor() {
    this.accountService = new AccountService();
  }

  private getLanguage(req: Parameters<RequestHandler>[0]): string {
    const language = req.headers.language;
    return typeof language === "string" ? language : "en";
  }

  createAccount: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const payload = res.locals.validatedBody as CreateAccountDto;

      const account = await this.accountService.createAccount(payload);

      ResponseUtil.success(
        res,
        "ACCOUNT_CREATED",
        account,
        201,
        this.getLanguage(req)
      );
    } catch (error: unknown) {
      next(error);
    }
  };

  getAccount: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const accountId = String(req.params.id);
      const account = await this.accountService.getAccount(accountId);

      ResponseUtil.success(
        res,
        "ACCOUNT_FETCHED",
        account,
        200,
        this.getLanguage(req)
      );
    } catch (error: unknown) {
      next(error);
    }
  };

  creditAccount: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const payload = res.locals.validatedBody as MoneyOperationDto;
      const idempotencyKey = req.headers["idempotency-key"];

      if (typeof idempotencyKey !== "string") {
        ResponseUtil.error(
          res,
          "IDEMPOTENCY_KEY_REQUIRED",
          400,
          this.getLanguage(req)
        );
        return;
      }

      const result = await this.accountService.creditAccount(
        String(req.params.id),
        payload,
        idempotencyKey
      );

      ResponseUtil.success(
        res,
        "ACCOUNT_CREDITED",
        result,
        200,
        this.getLanguage(req)
      );
    } catch (error: unknown) {
      next(error);
    }
  };

  debitAccount: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const payload = res.locals.validatedBody as MoneyOperationDto;
      const idempotencyKey = req.headers["idempotency-key"];

      if (typeof idempotencyKey !== "string") {
        ResponseUtil.error(
          res,
          "IDEMPOTENCY_KEY_REQUIRED",
          400,
          this.getLanguage(req)
        );
        return;
      }

      const result = await this.accountService.debitAccount(
        String(req.params.id),
        payload,
        idempotencyKey
      );

      ResponseUtil.success(
        res,
        "ACCOUNT_DEBITED",
        result,
        200,
        this.getLanguage(req)
      );
    } catch (error: unknown) {
      next(error);
    }
  };

  getAccountTransactions: RequestHandler = async (
    req,
    res,
    next
  ): Promise<void> => {
    try {
      const pagination = res.locals.pagination as PaginationDto;

      const result = await this.accountService.getAccountTransactions(
        String(req.params.id),
        pagination
      );

      ResponseUtil.success(
        res,
        "TRANSACTIONS_FETCHED",
        result,
        200,
        this.getLanguage(req)
      );
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const accountController = new AccountController();
