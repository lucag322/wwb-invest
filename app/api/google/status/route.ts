import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, getUserId } from "@/lib/get-user";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ connected: false });
  }

  try {
    const token = await prisma.googleDriveToken.findUnique({
      where: { userId },
      select: { id: true, rootFolderId: true },
    });
    return NextResponse.json({
      connected: !!token,
      rootFolderId: token?.rootFolderId,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId();
    await prisma.googleDriveToken.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
