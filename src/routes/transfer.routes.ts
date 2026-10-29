
import { Router } from "express";
import { transferValidator } from "../middleware/transfer.validator";
import { transferController } from "../controllers/transfer.controller";
import { validateIdempotencyKey } from "../middleware/idempotency-key.middleware";

const router = Router();

router.post(
  "/",
  transferValidator.createTransfer,
  validateIdempotencyKey,
  transferController.createTransfer
);

export default router;
