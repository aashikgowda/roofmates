import { NextResponse } from "next/server";
import { loadHousehold } from "@/lib/household";

// POST /api/households/join -> verify a code and return the household snapshot.
// body: { code: string }
export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code?.trim()) {
      return NextResponse.json({ error: "Enter a code." }, { status: 400 });
    }
    const data = await loadHousehold(code);
    if (!data) {
      return NextResponse.json(
        { error: "No household found with that code." },
        { status: 404 }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
