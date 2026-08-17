import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getHouseholdByCode } from "@/lib/household";

// POST /api/households/:code/chores -> create a rotating chore.
// body: { name, cadenceDays, participantIds: string[] }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { name, cadenceDays, participantIds } = await req.json();

    const cadence = Number(cadenceDays);
    if (!name?.trim())
      return NextResponse.json(
        { error: "Chore name is required." },
        { status: 400 }
      );
    if (!Number.isInteger(cadence) || cadence <= 0)
      return NextResponse.json(
        { error: "Pick how often it repeats." },
        { status: 400 }
      );
    if (!Array.isArray(participantIds) || participantIds.length === 0)
      return NextResponse.json(
        { error: "Pick at least one housemate to rotate through." },
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
    if (!participantIds.every((id: string) => valid.has(id)))
      return NextResponse.json(
        { error: "Invalid member reference." },
        { status: 400 }
      );

    const { data: chore, error } = await supabase
      .from("chores")
      .insert({
        household_id: household.id,
        name: name.trim(),
        cadence_days: cadence,
        participant_ids: participantIds,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ chore });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
