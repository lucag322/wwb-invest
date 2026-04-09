import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/get-user";
import { getDriveClient, getOrCreateRootFolder } from "@/lib/google-drive";
import { Readable } from "stream";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const drive = await getDriveClient(userId);
    if (!drive) {
      return NextResponse.json({ error: "not_connected" }, { status: 403 });
    }

    const folderId =
      req.nextUrl.searchParams.get("folderId") ||
      (await getOrCreateRootFolder(userId));

    if (!folderId) {
      return NextResponse.json({ error: "no_folder" }, { status: 500 });
    }

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink,thumbnailLink)",
      orderBy: "folder,name",
      pageSize: 100,
    });

    let breadcrumbs: Array<{ id: string; name: string }> = [];
    const rootId = await getOrCreateRootFolder(userId);
    if (folderId && folderId !== rootId) {
      breadcrumbs = await buildBreadcrumbs(drive, folderId, rootId || "");
    }

    return NextResponse.json({
      files: res.data.files || [],
      currentFolderId: folderId,
      rootFolderId: rootId,
      breadcrumbs,
    });
  } catch {
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const drive = await getDriveClient(userId);
    if (!drive) {
      return NextResponse.json({ error: "not_connected" }, { status: 403 });
    }

    const formData = await req.formData();
    const action = formData.get("action") as string;

    if (action === "createFolder") {
      const name = formData.get("name") as string;
      const parentId =
        (formData.get("parentId") as string) ||
        (await getOrCreateRootFolder(userId));

      const res = await drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: parentId ? [parentId] : undefined,
        },
        fields: "id,name,mimeType",
      });
      return NextResponse.json(res.data);
    }

    if (action === "upload") {
      const file = formData.get("file") as File;
      const parentId =
        (formData.get("parentId") as string) ||
        (await getOrCreateRootFolder(userId));

      const buffer = Buffer.from(await file.arrayBuffer());
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const res = await drive.files.create({
        requestBody: {
          name: file.name,
          parents: parentId ? [parentId] : undefined,
        },
        media: {
          mimeType: file.type,
          body: stream,
        },
        fields: "id,name,mimeType,size,modifiedTime,webViewLink",
      });
      return NextResponse.json(res.data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const drive = await getDriveClient(userId);
    if (!drive) {
      return NextResponse.json({ error: "not_connected" }, { status: 403 });
    }

    const { fileId } = await req.json();
    await drive.files.delete({ fileId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

async function buildBreadcrumbs(
  drive: Awaited<ReturnType<typeof getDriveClient>>,
  folderId: string,
  rootId: string
) {
  if (!drive) return [];
  const crumbs: Array<{ id: string; name: string }> = [];
  let currentId = folderId;

  while (currentId && currentId !== rootId) {
    try {
      const res = await drive.files.get({
        fileId: currentId,
        fields: "id,name,parents",
      });
      crumbs.unshift({ id: res.data.id!, name: res.data.name! });
      currentId = res.data.parents?.[0] || "";
    } catch {
      break;
    }
  }
  return crumbs;
}
