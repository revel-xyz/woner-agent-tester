import React, { useEffect, useRef } from "react";
import { ChatBubble } from "./ChatBubble";
import { LoadingBubble } from "./LoadingBubble";
import { ConverseWithAgentRequest } from "@/models/ConverseWithAgentRequest";
import { AgentConverseResponse } from "@/models/AgentConverseResponse";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useXRayMode } from "@/react-app/state/appState";
import { toggleXRayMode } from "@/react-app/state/appState";
import { observer } from "@legendapp/state/react";

interface Message {
  id: string;
  isUser: boolean;
  timestamp: string;
  data: ConverseWithAgentRequest | AgentConverseResponse | PaymentApprovalMessage;
}

interface ChatViewProps {
  messages: Message[];
  isLoading?: boolean;
  onNewMessage?: (
    message: ConverseWithAgentRequest | AgentConverseResponse | PaymentApprovalMessage,
    isUser: boolean
  ) => void;
  rootMovieId?: string;
  userId?: string;
}

export const ChatView: React.FC<ChatViewProps> = observer(
  ({ messages, isLoading, onNewMessage, rootMovieId, userId }) => {
    const xRayMode = useXRayMode();

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages, isLoading]);

    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Chat History</h2>
          <div className="flex items-center space-x-2">
            <Switch id="xray-mode" checked={xRayMode} onCheckedChange={toggleXRayMode} />
            <Label htmlFor="xray-mode">X-Ray Mode</Label>
          </div>
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
  }
);
