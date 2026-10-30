import { randomUUID } from 'crypto';
import type { RequestHandler } from 'express';

export const requestLogger: RequestHandler = (req, res, next) => {
  const id = randomUUID().slice(0, 8);
  const start = Date.now();
  res.locals.requestId = id;

  console.log(`[${id}] START  ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    console.log(`[${id}] FINISH ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });

  next();
};