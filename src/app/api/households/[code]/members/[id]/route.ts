import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getHouseholdByCode } from "@/lib/household";

// PATCH /api/households/:code/members/:id -> toggle vacation mode.
// body: { onVacation: boolean }
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  try {
    const { code, id } = await params;
    const { onVacation } = await req.json();
    const household = await getHouseholdByCode(code);
    if (!household)
      return NextResponse.json({ error: "Not found." }, { status: 404 });

    const supabase = getServiceClient();
    const { data: member, error } = await supabase
      .from("members")
      .update({ on_vacation: !!onVacation })
      .eq("id", id)
      .eq("household_id", household.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ member });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
