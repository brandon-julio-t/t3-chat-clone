"use client";

import type { User } from "better-auth";
import { useRouter } from "next/navigation";
import React from "react";
import { authClient } from "~/lib/auth-client";

const AutoSigninAnon: React.ComponentType<{
  user: User | null | undefined;
  children: React.ReactNode;
}> = ({ user, children }) => {
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      return;
    }

    void authClient.signIn.anonymous().then(() => {
      router.refresh();
    });
  }, [router, user]);

  if (!user) {
    return null;
  }

  return children;
};

export default AutoSigninAnon;
