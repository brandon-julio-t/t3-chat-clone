"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { saveChatApiKey } from "../server-actions/chat-api-key";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export const ApiKeyOnboarding = () => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        apiKey: z.string().min(1),
      }),
    ),
    defaultValues: {
      apiKey: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await saveChatApiKey(data.apiKey);

    router.refresh();
  });

  return (
    <main className="container mx-auto flex min-h-svh max-w-lg flex-col px-4">
      <section className="grid flex-1 place-items-center">
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenRouter API Key (BYOK)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      placeholder="sk-or-v1-..."
                    />
                  </FormControl>
                  <FormDescription>
                    Get your OpenRouter API key from{" "}
                    <a
                      href="https://openrouter.ai/settings/keys"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                    >
                      here
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </form>
        </Form>
      </section>
    </main>
  );
};
