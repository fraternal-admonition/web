import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AdminError extends Error {
  code: string;
  statusCode: number;
  userMessage: string;
  logDetails: Record<string, any>;

  constructor(
    code: string,
    statusCode: number,
    userMessage: string,
    logDetails: Record<string, any> = {}
  ) {
    super(userMessage);
    this.name = "AdminError";
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.logDetails = logDetails;
  }
}

/**
 * Handle API errors and return appropriate NextResponse
 */
export function handleAPIError(error: unknown): NextResponse {
  console.error("[API Error]", error);

  // Handle AdminError
  if (error instanceof AdminError) {
    return NextResponse.json(
      {
        error: error.userMessage,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    // Don't expose internal error messages in production
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: isDev ? error.message : "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  // Unknown error type
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Format error for user display
 */
export function formatUserError(error: AdminError): string {
  return error.userMessage;
}

/**
 * Common error constructors
 */
export const Errors = {
  Unauthorized: () =>
    new AdminError(
      "UNAUTHORIZED",
      401,
      "You must be signed in to access this resource"
    ),

  Forbidden: () =>
    new AdminError(
      "FORBIDDEN",
      403,
      "You don't have permission to access this resource"
    ),

  NotFound: (resource: string) =>
    new AdminError("NOT_FOUND", 404, `${resource} not found`),

  ValidationFailed: (details: string) =>
    new AdminError("VALIDATION_FAILED", 400, `Validation failed: ${details}`),

  AlreadyExists: (resource: string) =>
    new AdminError(
      "ALREADY_EXISTS",
      400,
      `${resource} already exists`
    ),

  RateLimitExceeded: () =>
    new AdminError(
      "RATE_LIMIT_EXCEEDED",
      429,
      "Too many requests. Please try again later"
    ),

  InternalError: (message?: string) =>
    new AdminError(
      "INTERNAL_ERROR",
      500,
      message || "An internal error occurred. Please try again"
    ),
};
