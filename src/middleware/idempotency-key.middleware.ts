import type { RequestHandler } from "express";
import ResponseUtil from "../utils/response";

export const validateIdempotencyKey: RequestHandler = (
  req,
  res,
  next
): void => {
  const idempotencyKey = req.headers["idempotency-key"];

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.trim().length === 0
  ) {
    ResponseUtil.error(
      res,
      "IDEMPOTENCY_KEY_REQUIRED",
      400,
      "en"
    );
    return;
  }

  if (idempotencyKey.length > 255) {
    ResponseUtil.error(
      res,
      {
        param: "idempotency-key",
        type: "invalid",
        message: "Idempotency key must not exceed 255 characters",
      },
      400,
      "en"
    );
    return;
  }

  next();
};