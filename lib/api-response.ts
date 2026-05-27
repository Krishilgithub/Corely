import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  version: string;
}

const API_VERSION = "v1";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      version: API_VERSION,
    },
    { status }
  );
}

export function errorResponse(message: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      version: API_VERSION,
    },
    { status }
  );
}
