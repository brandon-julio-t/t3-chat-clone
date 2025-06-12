"use server";

import { cookies } from "next/headers";
import { getSession } from "~/lib/auth";

export const getChatApiKey = async () => {
  const session = await getSession();
  if (!session?.user) {
    return "";
  }

  const cookieStore = await cookies();
  return cookieStore.get("chatApiKey")?.value ?? "";
};

export const saveChatApiKey = async (apiKey: string) => {
  const session = await getSession();
  if (!session?.user) {
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set("chatApiKey", apiKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
};

export const getImageApiKey = async () => {
  const session = await getSession();
  if (!session?.user) {
    return "";
  }

  const cookieStore = await cookies();
  return cookieStore.get("chatImageApiKey")?.value ?? "";
};

export const saveImageApiKey = async (apiKey: string) => {
  const session = await getSession();
  if (!session?.user) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set("chatImageApiKey", apiKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
};
