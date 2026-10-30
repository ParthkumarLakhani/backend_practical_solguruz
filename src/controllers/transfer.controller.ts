
import type { RequestHandler } from "express";
import ResponseUtil from "../utils/response";
import type { CreateTransferDto } from "../middleware/transfer.validator";
import { TransferService } from "../services/transfer.service";

export class TransferController {
  private readonly transferService: TransferService;

  constructor() {
    this.transferService = new TransferService();
  }

  createTransfer: RequestHandler = async (req, res): Promise<void> => {
    try {
      const payload = res.locals.validatedBody as CreateTransferDto;
      const idempotencyKey = req.headers["idempotency-key"];

      if (
        typeof idempotencyKey !== "string" ||
        idempotencyKey.trim().length === 0
      ) {
        ResponseUtil.error(
          res,
          "IDEMPOTENCY_KEY_REQUIRED",
          400
        );
        return;
      }

      const transfer = await this.transferService.createTransfer(
        payload,
        idempotencyKey
      );

      ResponseUtil.success(
        res,
        "TRANSFER_CREATED",
        transfer,
        201
      );
    } catch (error: any) {
      ResponseUtil.error(
        res,
        error.message,
        400
      );
    }
  };
}

export const transferController = new TransferController();
