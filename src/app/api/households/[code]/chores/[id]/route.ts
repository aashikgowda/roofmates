import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getHouseholdByCode } from "@/lib/household";

// DELETE /api/households/:code/chores/:id -> remove a chore.
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
      .from("chores")
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
