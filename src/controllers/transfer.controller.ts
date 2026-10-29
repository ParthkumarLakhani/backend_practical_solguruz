
import type { RequestHandler } from "express";
import ResponseUtil from "../utils/response";
import type { CreateTransferDto } from "../middleware/transfer.validator";
import { TransferService } from "../services/transfer.service";

export class TransferController {
  private readonly transferService: TransferService;

  constructor() {
    this.transferService = new TransferService();
  }

  private getLanguage(req: Parameters<RequestHandler>[0]): string {
    const language = req.headers.language;
    return typeof language === "string" ? language : "en";
  }

  createTransfer: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      const payload = res.locals.validatedBody as CreateTransferDto;
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

      const transfer = await this.transferService.createTransfer(
        payload,
        idempotencyKey
      );

      ResponseUtil.success(
        res,
        "TRANSFER_CREATED",
        transfer,
        201,
        this.getLanguage(req)
      );
    } catch (error: unknown) {
      next(error);
    }
  };
}

export const transferController = new TransferController();
