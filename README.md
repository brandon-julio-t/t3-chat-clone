Challenge accepted: https://cloneathon.t3.chat

## 🛠️ Development

### Step 1: Setup Infra

```bash
# setup .env
# [!] remember to setup `BETTER_AUTH_SECRET`, hint: try `npx nanoid` or something
# [!] need to se4tup `BLOB_READ_WRITE_TOKEN` from vercel KV
cp .env.example .env

# Install dependencies
bun install

# Setup DB
# Ideally prisma migrate dev, but for speed we use prisma db push
bun prisma db push
```

### Step 2: Run the App

```bash
# Run Caddy reverse proxy to enable HTTP/2 to fix electric sql performance issue
# https://electric-sql.com/docs/guides/troubleshooting#slow-shapes-mdash-why-are-my-shapes-slow-in-the-browser-in-local-development
caddy run

# Start Docker containers (PostgreSQL and Electric SQL)
docker compose up

# Run development server
bun dev
```

### Step 3: Visit https://localhost:4000

# AI Chat App Requirements

## Core Requirements (Required)

- [x] Chat with Various LLMs: Implement support for multiple language models and providers

> ✅ OpenRouter

- [x] Authentication & Sync: User authentication with chat history synchronization

> ✅ Better-Auth + anonymous plugin

- [x] Browser Friendly: Ensure web-based functionality without native app requirements

> ✅ tailwindcss + shadcn/ui

- [x] Easy to Try: Provide simple way for users to test the application

> ✅ https://t3-chat-clone-sigma.vercel.app/

## Bonus Features

- [x] Attachment Support: Allow users to upload files (images and pdfs)

> ✅ AI SDK (`experimental_attachments`) + OpenRouter

![image](https://github.com/user-attachments/assets/ad38b5f7-6f3b-4d41-8225-a882123ad146)

https://github.com/user-attachments/assets/213d1798-57c8-4af7-944f-702624ec8e08

- [x] Image Generation Support: Add AI-powered image generation capabilities

> ✅ LangDB

![image](https://github.com/user-attachments/assets/98f55eb3-2972-4f99-9979-0deed1c5e6e9)

- [x] Syntax Highlighting: Implement beautiful code formatting and highlighting

> ✅ React Shiki

![image](https://github.com/user-attachments/assets/9fb5194c-346e-4ac0-aed1-3a9d94428e24)

- [x] Resumable Streams: Enable continuing generation after page refresh

> ✅ Electric SQL

https://github.com/user-attachments/assets/6f436b81-b2c4-482e-adcd-37b0279a6c6a

> 💡 Note: the refresh are triggered by me (`CMD+R`)

- [x] Chat Branching: Create alternative conversation paths

> ✅ Real world usage of linked list

https://github.com/user-attachments/assets/3b073de9-d752-471b-a0e7-a84a789142a4

- [x] Chat Sharing: Allow sharing conversations with others

> ✅ Freeze the linked list

![image](https://github.com/user-attachments/assets/43ef91ec-dbc2-41cc-a69f-838201aad929)

![image](https://github.com/user-attachments/assets/6d629179-acad-4b87-87c9-9376c54b9a55)

- [x] Web Search: Integrate real-time web search functionality

> ✅ OpenRouter

![image](https://github.com/user-attachments/assets/23492e93-2099-4447-8a15-e7889c4713c8)

![image](https://github.com/user-attachments/assets/f7fd6789-41bc-4d71-967d-f9f6b00d8831)

- [x] Bring Your Own Key: Support for custom API keys

> ✅ OpenRouter + Next.js cookie

![image](https://github.com/user-attachments/assets/af53bc2e-92e7-4918-b70f-c542f9468bcb)

![image](https://github.com/user-attachments/assets/adf0edc7-869a-4490-b7ed-00c43832973c)

- [ ] Mobile App: Develop mobile version alongside web app

> 🚧 WIP, Thinking...

- [ ] Custom Features: Add your own unique and creative features

> 🚧 WIP, Thinking...

---

# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
