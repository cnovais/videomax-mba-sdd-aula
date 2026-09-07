import { ZodError } from "zod";
import { AppError } from "@/domain/_shared/errors";
import type { HttpResponse } from "./types";

/**
 * Central error → HTTP response mapper. The single place errors from any
 * layer are translated into a status/body. Handlers never catch; the
 * framework adapter (fastify-server.ts) calls this once per request.
 */
export function toHttpResponse(error: unknown): HttpResponse {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined && { details: error.details }),
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        details: error.flatten(),
      },
    };
  }

  console.error("Unexpected error:", error);
  return {
    status: 500,
    body: { code: "INTERNAL_ERROR", message: "Unexpected error" },
  };
}
