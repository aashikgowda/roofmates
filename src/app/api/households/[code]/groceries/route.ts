import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getHouseholdByCode } from "@/lib/household";

// POST /api/households/:code/groceries -> add an item to the shared board.
// body: { name: string, addedBy: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { name, addedBy } = await req.json();
    if (!name?.trim())
      return NextResponse.json({ error: "Item name is required." }, {
        status: 400,
      });
    if (!addedBy)
      return NextResponse.json({ error: "Missing member." }, { status: 400 });

    const household = await getHouseholdByCode(code);
    if (!household)
      return NextResponse.json({ error: "Not found." }, { status: 404 });

    const supabase = getServiceClient();
    const { data: item, error } = await supabase
      .from("groceries")
      .insert({
        household_id: household.id,
        name: name.trim(),
        added_by: addedBy,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
