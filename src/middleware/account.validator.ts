
import type { RequestHandler } from "express";
import { z } from "zod";
import ResponseUtil from "../utils/response";

const createAccountSchema = z
  .object({
    ownerName: z.string().trim().min(1).max(100),
    currency: z.string().regex(/^[A-Za-z]{3}$/),
  })
  .strict();

const accountIdSchema = z.object({
  id: z.string().uuid(),
});

const moneyOperationSchema = z
  .object({
    amount: z.number().int().positive().safe(),
    reference: z.string().trim().min(1).max(255),
  })
  .strict();

const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateAccountDto = z.infer<typeof createAccountSchema>;
export type MoneyOperationDto = z.infer<typeof moneyOperationSchema>;
export type PaginationDto = z.infer<typeof paginationSchema>;

export class AccountValidator {
  createAccount: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const result = createAccountSchema.safeParse(req.body);

      if (!result.success) {
        ResponseUtil.zodResponse(result, req, res, next);
        return;
      }

      res.locals.validatedBody = result.data;
      next();
    } catch (error: unknown) {
      ResponseUtil.error(res, "ACCOUNT_VALIDATION_FAILED", 500);
    }
  };

  validateAccountId: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const result = accountIdSchema.safeParse(req.params);

      if (!result.success) {
        ResponseUtil.zodResponse(result, req, res, next);
        return;
      }

      next();
    } catch (error: unknown) {
      ResponseUtil.error(res, "ACCOUNT_ID_VALIDATION_FAILED", 500);
    }
  };

  validateMoney: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const result = moneyOperationSchema.safeParse(req.body);

      if (!result.success) {
        ResponseUtil.zodResponse(result, req, res, next);
        return;
      }

      res.locals.validatedBody = result.data;
      next();
    } catch (error: unknown) {
      ResponseUtil.error(res, "MONEY_VALIDATION_FAILED", 500);
    }
  };

  validatePagination: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const result = paginationSchema.safeParse(req.query);

      if (!result.success) {
        ResponseUtil.zodResponse(result, req, res, next);
        return;
      }

      res.locals.pagination = result.data;
      next();
    } catch (error: unknown) {
      ResponseUtil.error(res, "PAGINATION_VALIDATION_FAILED", 500);
    }
  };
}

export const accountValidator = new AccountValidator();
