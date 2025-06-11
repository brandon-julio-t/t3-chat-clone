"use server";

import { put } from "@vercel/blob";
import { getSession } from "~/lib/auth";

export const uploadFiles = async (files: FileList) => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return await Promise.all(
    Array.from(files).map(async (file) => {
      const response = await put(file.name, file, {
        access: "public",
        addRandomSuffix: true,
      });

      return response;
    }),
  );
};
