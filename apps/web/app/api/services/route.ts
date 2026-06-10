import { NextRequest, NextResponse } from "next/server";
import { buildCatalog } from "@eudr-guardian/acp";

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "https://eudr-guardian.vercel.app";
  const catalog = buildCatalog(origin);
  return NextResponse.json(catalog);
}
