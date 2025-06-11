import { redirect } from "next/navigation";
import { ulid } from "ulid";

export default async function Home() {
  redirect(`/chat/${ulid()}`);
}
