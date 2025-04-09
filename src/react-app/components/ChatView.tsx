import React, { useEffect, useRef } from "react";
import { ChatBubble } from "./ChatBubble";
import { LoadingBubble } from "./LoadingBubble";
import { AgentRequest } from "@/models/AgentRequest";
import { AgentResponse } from "@/models/AgentResponse";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";

interface Message {
  id: string;
  isUser: boolean;
  timestamp: string;
  data: AgentRequest | AgentResponse | PaymentApprovalMessage;
}

interface ChatViewProps {
  messages: Message[];
  isLoading?: boolean;
  onNewMessage?: (
    message: AgentRequest | AgentResponse | PaymentApprovalMessage,
    isUser: boolean
  ) => void;
  rootMovieId?: string;
  userId?: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onNewMessage,
  rootMovieId,
  userId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold">Chat History</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message.data}
            isUser={message.isUser}
            timestamp={message.timestamp}
            onNewMessage={onNewMessage}
            rootMovieId={rootMovieId}
            userId={userId}
          />
        ))}
        {isLoading && <LoadingBubble />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
