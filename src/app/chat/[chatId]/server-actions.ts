"use server";

import { cookies } from "next/headers";
import { getSession } from "~/lib/auth";

export const getChatModel = async () => {
  const session = await getSession();
  if (!session?.user) {
    return "gpt-4.1-nano";
  }

  const cookieStore = await cookies();
  const model = cookieStore.get("model")?.value ?? "gpt-4.1-nano";
  return model;
};

export const saveChatModel = async (model: string) => {
  const session = await getSession();
  if (!session?.user) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set("model", model);
};

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
