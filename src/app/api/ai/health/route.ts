import { NextResponse } from "next/server";
import { getModelHealthSnapshot } from "@/lib/ai/model-health";

export const runtime = "nodejs";

export async function GET() {
  const health = await getModelHealthSnapshot();
  const status = health.ok ? 200 : 503;
  return NextResponse.json(health, { status });
}
