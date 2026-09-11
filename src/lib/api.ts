import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

import { AdminAuthError } from "@/lib/admin";
import { StoreValidationError } from "@/lib/store";

/**
 * Runs a route body and turns the expected failure kinds into 4xx responses
 * with a message the UI can show, so every route does not repeat the same
 * try/catch. `headers` is applied to success and error responses alike.
 */
export async function handle<T>(
  work: () => Promise<T>,
  headers?: HeadersInit,
): Promise<NextResponse> {
  try {
    return NextResponse.json(await work(), { headers });
  } catch (error) {
    if (error instanceof StoreValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400, headers });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "That request was not valid." },
        { status: 400, headers },
      );
    }
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong saving that." },
      { status: 500, headers },
    );
  }
}

export async function parseBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    throw new StoreValidationError("Expected a JSON body.");
  }
  return schema.parse(json);
}
