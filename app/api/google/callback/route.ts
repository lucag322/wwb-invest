import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCode } from "@/lib/google-drive";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const userId = req.nextUrl.searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(
      new URL("/documents?error=missing_params", req.url)
    );
  }

  try {
    console.log("[Google Callback] Exchanging code for userId:", userId);
    const tokens = await exchangeCode(code);
    console.log("[Google Callback] Tokens received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });

    if (!tokens.access_token) {
      console.error("[Google Callback] No access token received");
      return NextResponse.redirect(
        new URL("/documents?error=no_access_token", req.url)
      );
    }

    await prisma.googleDriveToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        ...(tokens.refresh_token
          ? { refreshToken: tokens.refresh_token }
          : {}),
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || "",
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      },
    });

    console.log("[Google Callback] Token saved successfully");
    return NextResponse.redirect(new URL("/documents", req.url));
  } catch (err) {
    console.error("[Google Callback] Error:", err);
    return NextResponse.redirect(
      new URL("/documents?error=auth_failed", req.url)
    );
  }
}
