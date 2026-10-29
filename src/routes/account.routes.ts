
import { Router } from "express";
import { accountValidator } from "../middleware/account.validator";
import { accountController } from "../controllers/account.controller";
import { validateIdempotencyKey } from "../middleware/idempotency-key.middleware";

const router = Router();

router.post(
  "/",
  accountValidator.createAccount,
  accountController.createAccount
);

router.get(
  "/:id",
  accountValidator.validateAccountId,
  accountController.getAccount
);

router.post(
  "/:id/credit",
  accountValidator.validateAccountId,
  accountValidator.validateMoney,
  validateIdempotencyKey,
  accountController.creditAccount
);

router.post(
  "/:id/debit",
  accountValidator.validateAccountId,
  accountValidator.validateMoney,
  validateIdempotencyKey,
  accountController.debitAccount
);

router.get(
  "/:id/transactions",
  accountValidator.validateAccountId,
  accountValidator.validatePagination,
  accountController.getAccountTransactions
);

export default router;
