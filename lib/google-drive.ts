import { google } from "googleapis";
import { prisma } from "./prisma";

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const APP_FOLDER_NAME = "WWB Investissement";

function getOAuth2Client() {
  const baseUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${baseUrl}/api/google/callback`
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

export async function getDriveClient(_userId?: string) {
  const token = await prisma.googleDriveToken.findFirst();
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
        where: { id: token.id },
        data: update,
      });
    }
  });

  return google.drive({ version: "v3", auth: client });
}

export async function getOrCreateRootFolder(_userId?: string) {
  const token = await prisma.googleDriveToken.findFirst();
  if (!token) return null;

  if (token.rootFolderId) {
    const drive = await getDriveClient();
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

  const drive = await getDriveClient();
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
    where: { id: token.id },
    data: { rootFolderId: folderId },
  });

  return folderId;
}
