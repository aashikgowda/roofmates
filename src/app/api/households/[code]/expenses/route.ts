import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getHouseholdByCode } from "@/lib/household";
import { equalShares } from "@/lib/finance";

// POST /api/households/:code/expenses -> add an expense split equally among the
// selected members.
// body: { description, amount, paidBy, splitAmong: string[] }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { description, amount, paidBy, splitAmong } = await req.json();

    const amt = Number(amount);
    if (!description?.trim())
      return NextResponse.json(
        { error: "Description is required." },
        { status: 400 }
      );
    if (!Number.isFinite(amt) || amt <= 0)
      return NextResponse.json(
        { error: "Amount must be greater than 0." },
        { status: 400 }
      );
    if (!paidBy)
      return NextResponse.json(
        { error: "Select who paid." },
        { status: 400 }
      );
    if (!Array.isArray(splitAmong) || splitAmong.length === 0)
      return NextResponse.json(
        { error: "Select at least one person to split with." },
        { status: 400 }
      );

    const household = await getHouseholdByCode(code);
    if (!household)
      return NextResponse.json({ error: "Not found." }, { status: 404 });

    const supabase = getServiceClient();

    // Validate that all referenced members belong to this household.
    const { data: members, error: mErr } = await supabase
      .from("members")
      .select("id")
      .eq("household_id", household.id);
    if (mErr) throw mErr;
    const validIds = new Set((members ?? []).map((m) => m.id));
    if (!validIds.has(paidBy) || !splitAmong.every((id) => validIds.has(id)))
      return NextResponse.json(
        { error: "Invalid member reference." },
        { status: 400 }
      );

    const { data: expense, error: eErr } = await supabase
      .from("expenses")
      .insert({
        household_id: household.id,
        description: description.trim(),
        amount: amt,
        paid_by: paidBy,
      })
      .select()
      .single();
    if (eErr) throw eErr;

    const shares = equalShares(amt, splitAmong.length);
    const splitRows = splitAmong.map((memberId: string, i: number) => ({
      expense_id: expense.id,
      member_id: memberId,
      share: shares[i],
    }));
    const { error: sErr } = await supabase
      .from("expense_splits")
      .insert(splitRows);
    if (sErr) throw sErr;

    return NextResponse.json({ expense });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
