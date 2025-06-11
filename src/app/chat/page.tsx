import { redirect } from "next/navigation";
import { ulid } from "ulid";

const ChatPage = () => {
  redirect(`/chat/${ulid()}`);
};

export default ChatPage;
