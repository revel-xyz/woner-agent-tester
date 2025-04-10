import React, { useState } from "react";
import { AgentRequest } from "@/models/AgentRequest";
import { AgentResponse } from "@/models/AgentResponse";
import { approvePayment, getPendingChanges } from "@/react-app/services/backendApi";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";
import { Modal } from "./Modal";
import { toast } from "sonner";
import { useXRayMode } from "@/react-app/state/appState";
import { observer } from "@legendapp/state/react";
interface ChatBubbleProps {
  message: AgentRequest | AgentResponse | PaymentApprovalMessage;
  isUser: boolean;
  timestamp?: string;
  onNewMessage?: (
    message: AgentRequest | AgentResponse | PaymentApprovalMessage,
    isUser: boolean
  ) => void;
  rootMovieId?: string;
  userId?: string;
}

type ScriptChanges = {
  data: Record<string, unknown> | null;
  error: boolean;
  isPending: boolean;
};

export const ChatBubble: React.FC<ChatBubbleProps> = observer(
  ({ message, isUser, timestamp, onNewMessage, rootMovieId, userId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scriptChanges, setScriptChanges] = useState<ScriptChanges>({
      data: null,
      error: false,
      isPending: false,
    });
    const [isLoadingChanges, setIsLoadingChanges] = useState(false);
    const xRayMode = useXRayMode();

    // Format the message based on its type and X-Ray mode
    const formattedMessage = React.useMemo(() => {
      if (!xRayMode) {
        if (isUser && "message" in message) {
          return message.message;
        } else if (!isUser && "content" in message) {
          return message.content.message;
        }
      }
      return JSON.stringify(message, null, 2);
    }, [message, isUser, xRayMode]);

    const handleApprovePayment = async () => {
      if (
        !("message_type" in message) ||
        !("conversation_id" in message) ||
        !message.payment_request_id ||
        !rootMovieId ||
        !userId
      ) {
        console.error("Missing required fields for payment approval");
        return;
      }

      const approvalMessage = {
        conversation_id: message.conversation_id,
        root_movie_id: rootMovieId,
        payment_request_id: message.payment_request_id,
        is_approved: true,
        user_id: userId,
      };

      // Add the approval request to the chat
      onNewMessage?.(approvalMessage, true);

      try {
        // Send the approval
        const response = await approvePayment(approvalMessage);
        // Add the response to the chat
        onNewMessage?.(response, false);
      } catch (error) {
        console.error("Failed to approve payment:", error);
        onNewMessage?.(
          {
            content: {
              message: `Error: ${
                error instanceof Error ? error.message : "Failed to approve payment"
              }`,
              price_in_credits: 0,
            },
            conversation_id: "error",
            message_type: "error",
            role: "assistant",
          },
          false
        );
      }
    };

    const handleShowScriptChanges = async () => {
      if (!("message_type" in message) || !message.payment_request_id) {
        console.error("Missing payment request ID");
        return;
      }

      setIsLoadingChanges(true);
      setIsModalOpen(true);

      try {
        const changes = await getPendingChanges(message.payment_request_id);

        if (changes === null) {
          setScriptChanges({ data: null, error: true, isPending: false });
        } else if (changes === "") {
          setScriptChanges({ data: null, error: false, isPending: true });
        } else {
          try {
            const parsedChanges = JSON.parse(changes);
            setScriptChanges({ data: parsedChanges, error: false, isPending: false });
          } catch (parseError) {
            console.error("Failed to parse script changes:", parseError);
            setScriptChanges({ data: null, error: true, isPending: false });
          }
        }
      } catch (error) {
        console.error("Failed to load script changes:", error);
        setScriptChanges({ data: null, error: true, isPending: false });
      } finally {
        setIsLoadingChanges(false);
      }
    };

    const isPaymentRequest =
      !isUser && "message_type" in message && message.message_type === "payment_request";

    const renderModalContent = () => {
      if (isLoadingChanges) {
        return (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        );
      }

      if (scriptChanges.error) {
        return (
          <div className="text-center text-gray-600 py-8">We couldn't load the script changes</div>
        );
      }

      if (scriptChanges.isPending) {
        return (
          <div className="text-center text-gray-600 py-8">
            Agent will rewrite the script just after payment approval
          </div>
        );
      }

      if (scriptChanges.data) {
        const scriptJson = JSON.stringify(scriptChanges.data, null, 2);

        const handleCopyToClipboard = () => {
          navigator.clipboard
            .writeText(scriptJson)
            .then(() => {
              toast.success("Script changes copied to clipboard");
            })
            .catch((err) => {
              console.error("Failed to copy script changes: ", err);
              toast.error("Failed to copy script changes");
            });
        };

        return (
          <div className="relative">
            <button
              onClick={handleCopyToClipboard}
              className="absolute top-0 right-0 p-2 text-gray-500 hover:text-blue-500 transition-colors"
              title="Copy to clipboard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            </button>
            <pre className="whitespace-pre-wrap text-left font-mono text-sm bg-gray-50 p-4 rounded mt-8">
              {scriptJson}
            </pre>
          </div>
        );
      }

      return null;
    };

    return (
      <>
        <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
          <div
            className={`max-w-[70%] rounded-lg p-4 ${
              isUser
                ? "bg-blue-500 text-white rounded-br-none"
                : "bg-gray-200 text-gray-800 rounded-bl-none"
            }`}
          >
            <pre className="whitespace-pre-wrap text-left font-mono text-sm overflow-x-auto">
              {formattedMessage}
            </pre>
            {timestamp && (
              <div className={`text-xs mt-1 ${isUser ? "text-blue-100" : "text-gray-500"}`}>
                {timestamp}
              </div>
            )}
            {isPaymentRequest && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleApprovePayment}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Approve Payment
                </button>
                <button
                  onClick={handleShowScriptChanges}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Show Script Changes
                </button>
              </div>
            )}
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Script Changes">
          {renderModalContent()}
        </Modal>
      </>
    );
  }
);
