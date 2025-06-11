"use server";

import { cookies } from "next/headers";
import { getSession } from "~/lib/auth";

export const getChatApiKey = async () => {
  const session = await getSession();
  if (!session?.user) {
    return "";
  }

  const cookieStore = await cookies();
  return cookieStore.get("apiKey")?.value ?? "";
};

export const saveChatApiKey = async (apiKey: string) => {
  const session = await getSession();
  if (!session?.user) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set("apiKey", apiKey);
};
