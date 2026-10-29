
import type { RequestHandler } from "express";
import { z } from "zod";
import ResponseUtil from "../utils/response";

const createTransferSchema = z
  .object({
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid(),
    amount: z.number().int().positive().safe(),
    reference: z.string().trim().min(1).max(255),
  })
  .strict()
  .refine(
    (data) => data.fromAccountId !== data.toAccountId,
    {
      message: "Source and destination accounts must be different",
      path: ["toAccountId"],
    }
  );

export type CreateTransferDto = z.infer<typeof createTransferSchema>;

export class TransferValidator {
  /**
   * Validate the request body for creating a transfer.
   */
  createTransfer: RequestHandler = (req, res, next): void => {
    const result = createTransferSchema.safeParse(req.body);

    if (!result.success) {
      ResponseUtil.zodResponse(result, req, res, next);
      return;
    }

    res.locals.validatedBody = result.data;
    next();
  };
}

export const transferValidator = new TransferValidator();
