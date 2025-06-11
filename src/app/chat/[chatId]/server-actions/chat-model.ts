"use server";

import { cookies } from "next/headers";
import { getSession } from "~/lib/auth";

const DEFAULT_MODEL = "meta-llama/llama-4-maverick:free";

export const getChatModel = async () => {
  const session = await getSession();
  if (!session?.user) {
    return DEFAULT_MODEL;
  }

  const cookieStore = await cookies();
  const model = cookieStore.get("model")?.value ?? DEFAULT_MODEL;
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
