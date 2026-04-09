import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/google-drive";
import { requireUserId } from "@/lib/get-user";

export async function GET() {
  try {
    const userId = await requireUserId();
    const url = getAuthUrl(userId);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
