import { google } from "googleapis";
import { prisma } from "./prisma";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const APP_FOLDER_NAME = "WWB Investissement";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.AUTH_URL}/api/google/callback`
  );
}

export function getAuthUrl(state: string) {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCode(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getDriveClient(userId: string) {
  const token = await prisma.googleDriveToken.findUnique({
    where: { userId },
  });
  if (!token) return null;

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    expiry_date: token.expiresAt.getTime(),
  });

  client.on("tokens", async (newTokens) => {
    const update: { accessToken?: string; expiresAt?: Date } = {};
    if (newTokens.access_token) update.accessToken = newTokens.access_token;
    if (newTokens.expiry_date)
      update.expiresAt = new Date(newTokens.expiry_date);
    if (Object.keys(update).length > 0) {
      await prisma.googleDriveToken.update({
        where: { userId },
        data: update,
      });
    }
  });

  return google.drive({ version: "v3", auth: client });
}

export async function getOrCreateRootFolder(userId: string) {
  const token = await prisma.googleDriveToken.findUnique({
    where: { userId },
  });
  if (!token) return null;

  if (token.rootFolderId) {
    const drive = await getDriveClient(userId);
    if (!drive) return null;
    try {
      const res = await drive.files.get({
        fileId: token.rootFolderId,
        fields: "id,trashed",
      });
      if (res.data.id && !res.data.trashed) return token.rootFolderId;
    } catch {
      // folder deleted, recreate
    }
  }

  const drive = await getDriveClient(userId);
  if (!drive) return null;

  const res = await drive.files.create({
    requestBody: {
      name: APP_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id",
  });

  const folderId = res.data.id!;
  await prisma.googleDriveToken.update({
    where: { userId },
    data: { rootFolderId: folderId },
  });

  return folderId;
}
