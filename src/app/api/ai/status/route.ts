import { NextResponse } from "next/server";

import { getAIConfigurationStatus } from "@/lib/ai/config";

export async function GET() {
  return NextResponse.json(getAIConfigurationStatus());
}
