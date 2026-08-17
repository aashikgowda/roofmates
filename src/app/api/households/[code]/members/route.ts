import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getHouseholdByCode } from "@/lib/household";

// POST /api/households/:code/members -> add yourself to the household.
// body: { name: string }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    const household = await getHouseholdByCode(code);
    if (!household) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const supabase = getServiceClient();
    const { data: member, error } = await supabase
      .from("members")
      .insert({ household_id: household.id, name: name.trim() })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ member });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
