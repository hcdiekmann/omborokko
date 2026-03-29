import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code ?? "app_error",
          details: error.details ?? null
        }
      },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: "Validation failed",
          code: "validation_error",
          details: error.flatten()
        }
      },
      { status: 400 }
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error";

  return NextResponse.json(
    {
      error: {
        message,
        code: "internal_error"
      }
    },
    { status: 500 }
  );
}
