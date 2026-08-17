import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getHouseholdByCode } from "@/lib/household";

// PATCH /api/households/:code/groceries/:id -> toggle bought / who bought it.
// body: { bought: boolean, boughtBy: string | null }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { bought, boughtBy } = await req.json();
    const household = await getHouseholdByCode(code);
    if (!household)
      return NextResponse.json({ error: "Not found." }, { status: 404 });

    const supabase = getServiceClient();
    const { data: item, error } = await supabase
      .from("groceries")
      .update({
        bought: !!bought,
        bought_by: bought ? boughtBy ?? null : null,
        bought_at: bought ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .eq("household_id", household.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/households/:code/groceries/:id -> remove an item.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const household = await getHouseholdByCode(code);
    if (!household)
      return NextResponse.json({ error: "Not found." }, { status: 404 });

    const supabase = getServiceClient();
    const { error } = await supabase
      .from("groceries")
      .delete()
      .eq("id", id)
      .eq("household_id", household.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
