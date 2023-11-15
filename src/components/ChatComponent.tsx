"use client";

import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Message, useChat } from "ai/react";
import MessageList from "./MessageList";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type props = {
  chatId: number;
};

const ChatComponent = ({ chatId }: props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      console.log("requesting to get old messages ");
      const response = await axios.post<Message[]>("/api/get-messages", {
        chatId,
      });
      return response.data;
    },
  });

  const { input, handleInputChange, handleSubmit, messages } = useChat({
    api: "/api/chat",
    body: {
      chatId,
    },
    initialMessages: data || [],
  });
  return (
    <div className="realtive max-h-screen overflow-scroll">
      {/*header */}
      <div className="sticky top-0 insert-x-0 p-2 bg-white h-fit">
        <div className="text-x1 font-bold">chats</div>
      </div>
      {/* message list  */}
      <MessageList messages={messages} isLoading={isLoading}></MessageList>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 insert-x-0 py-4 bg-white"
      >
        <div className="flex">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask any question"
            className="w-full"
          ></Input>
          <Button className="bg-blue-600 ml-2">
            <Send className="h-4 w-4"></Send>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
