"use server";

import { cookies } from "next/headers";
import { getSession } from "~/lib/auth";
import { DEFAULT_AI_MODEL } from "~/app/domains/chat/constants";

export const getChatModel = async () => {
  const session = await getSession();
  if (!session?.user) {
    return DEFAULT_AI_MODEL;
  }

  const cookieStore = await cookies();
  const model = cookieStore.get("model")?.value ?? DEFAULT_AI_MODEL;
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
