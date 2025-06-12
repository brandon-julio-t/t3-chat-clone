"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
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
import {
  saveChatApiKey,
  saveImageApiKey,
} from "../server-actions/chat-api-key";

export const ApiKeyOnboarding = ({
  initialChatApiKey,
  initialImageApiKey,
  onSuccess,
}: {
  initialChatApiKey: string;
  initialImageApiKey: string;
  onSuccess?: () => void;
}) => {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(
      z.object({
        chatApiKey: z.string().min(1),
        imageApiKey: z.string(),
      }),
    ),
    defaultValues: {
      chatApiKey: initialChatApiKey,
      imageApiKey: initialImageApiKey,
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    await saveChatApiKey(data.chatApiKey);
    await saveImageApiKey(data.imageApiKey);

    router.refresh();

    onSuccess?.();
  });

  return (
    <section className="grid flex-1 place-items-center">
      <Form {...form}>
        <form onSubmit={onSubmit} className="flex w-full flex-col gap-6">
          <h2 className="text-xl font-medium">Bring Your Own Keys (BYOK)</h2>

          <FormField
            control={form.control}
            name="chatApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OpenRouter Chat API Key</FormLabel>
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

          <FormField
            control={form.control}
            name="imageApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LangDB Image API Key (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="sk-..." />
                </FormControl>
                <FormDescription>
                  Get your LangDB API key from{" "}
                  <a
                    href="https://app.langdb.ai/settings/api_keys"
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
  );
};
