import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { generateCode } from "@/lib/finance";

// POST /api/households  -> create a household with an initial member.
// body: { householdName: string, memberName: string }
export async function POST(req: Request) {
  try {
    const { householdName, memberName } = await req.json();
    if (!householdName?.trim() || !memberName?.trim()) {
      return NextResponse.json(
        { error: "Household name and your name are required." },
        { status: 400 }
      );
    }
    const supabase = getServiceClient();

    // Retry a few times in the unlikely event of a code collision.
    let household = null;
    for (let attempt = 0; attempt < 5 && !household; attempt++) {
      const code = generateCode();
      const { data, error } = await supabase
        .from("households")
        .insert({ name: householdName.trim(), code })
        .select()
        .single();
      if (!error) household = data;
      else if (error.code !== "23505") throw error; // 23505 = unique violation
    }
    if (!household) throw new Error("Could not generate a unique code.");

    const { data: member, error: mErr } = await supabase
      .from("members")
      .insert({ household_id: household.id, name: memberName.trim() })
      .select()
      .single();
    if (mErr) throw mErr;

    return NextResponse.json({ household, member });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
