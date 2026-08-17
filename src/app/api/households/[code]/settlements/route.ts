import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getHouseholdByCode } from "@/lib/household";

// POST /api/households/:code/settlements -> record a payment from one member to
// another. Stored as an expense (paid_by = payer, single split onto recipient,
// is_settlement = true) so it flows through the same balance math.
// body: { from: string, to: string, amount: number }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { from, to, amount, actingMemberId } = await req.json();

    const amt = Number(amount);
    if (!from || !to)
      return NextResponse.json(
        { error: "Both payer and recipient are required." },
        { status: 400 }
      );
    if (from === to)
      return NextResponse.json(
        { error: "Payer and recipient must be different." },
        { status: 400 }
      );
    // You can only settle a payment you're part of (paying or receiving).
    if (actingMemberId !== from && actingMemberId !== to)
      return NextResponse.json(
        { error: "You can only settle payments that involve you." },
        { status: 403 }
      );
    if (!Number.isFinite(amt) || amt <= 0)
      return NextResponse.json(
        { error: "Amount must be greater than 0." },
        { status: 400 }
      );

    const household = await getHouseholdByCode(code);
    if (!household)
      return NextResponse.json({ error: "Not found." }, { status: 404 });

    const supabase = getServiceClient();
    const { data: members, error: mErr } = await supabase
      .from("members")
      .select("id")
      .eq("household_id", household.id);
    if (mErr) throw mErr;
    const valid = new Set((members ?? []).map((m) => m.id));
    if (!valid.has(from) || !valid.has(to))
      return NextResponse.json(
        { error: "Invalid member reference." },
        { status: 400 }
      );

    const { data: expense, error: eErr } = await supabase
      .from("expenses")
      .insert({
        household_id: household.id,
        description: "Settle up",
        amount: amt,
        paid_by: from,
        is_settlement: true,
      })
      .select()
      .single();
    if (eErr) throw eErr;

    const { error: sErr } = await supabase
      .from("expense_splits")
      .insert({ expense_id: expense.id, member_id: to, share: amt });
    if (sErr) throw sErr;

    return NextResponse.json({ payment: expense });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
