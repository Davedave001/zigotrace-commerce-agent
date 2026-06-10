import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const txId = req.nextUrl.searchParams.get("txId");
  if (!txId) {
    return NextResponse.json({ error: "txId required" }, { status: 400 });
  }

  // Mirror Node lookup
  const network = process.env.HEDERA_NETWORK ?? "testnet";
  const mirrorUrl =
    network === "mainnet"
      ? `https://mainnet.mirrornode.hedera.com/api/v1/transactions/${txId}`
      : `https://testnet.mirrornode.hedera.com/api/v1/transactions/${txId}`;

  try {
    const res = await fetch(mirrorUrl);
    if (!res.ok) {
      return NextResponse.json({ verified: false, error: "Transaction not found" }, { status: 404 });
    }
    const data = await res.json();
    const success = data.transactions?.[0]?.result === "SUCCESS";
    return NextResponse.json({ verified: success, transaction: data.transactions?.[0] });
  } catch {
    return NextResponse.json({ verified: false, error: "Mirror node lookup failed" }, { status: 500 });
  }
}
