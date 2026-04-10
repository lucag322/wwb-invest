import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const MCP_USER_ID = "cmnrh69vk0000jr0aw449ywjm";

export async function getUserId(): Promise<string | null> {
  const h = await headers();
  const apiKey = h.get("x-api-key");
  if (apiKey && process.env.MCP_API_KEY && apiKey === process.env.MCP_API_KEY) {
    return MCP_USER_ID;
  }

  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}
