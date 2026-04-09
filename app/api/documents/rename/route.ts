import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/get-user";
import { getDriveClient } from "@/lib/google-drive";

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const drive = await getDriveClient(userId);
    if (!drive) {
      return NextResponse.json({ error: "not_connected" }, { status: 403 });
    }

    const { fileId, name } = await req.json();
    const res = await drive.files.update({
      fileId,
      requestBody: { name },
      fields: "id,name",
    });
    return NextResponse.json(res.data);
  } catch {
    return NextResponse.json({ error: "Rename failed" }, { status: 500 });
  }
}
