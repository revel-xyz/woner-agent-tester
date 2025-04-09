import React, { useState } from "react";
import { AgentRequest } from "@/models/AgentRequest";
import { converseWithAgent, getScript } from "@/react-app/services/backendApi";
import { ElementTyps } from "@/models/enums";
import { ChatView } from "@/react-app/components/ChatView";
import { AgentResponse } from "@/models/AgentResponse";
import { Modal } from "@/react-app/components/Modal";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";

interface Message {
  id: string;
  isUser: boolean;
  timestamp: string;
  data: AgentRequest | AgentResponse | PaymentApprovalMessage;
}

type ScriptData = {
  data: AgentResponse | null;
  error: boolean;
  isLoading: boolean;
};

const HomeScreen: React.FC = () => {
  const [request, setRequest] = useState<AgentRequest>({
    message: "",
    element_type: ElementTyps.MOVIE,
    root_element_id: "",
    element_id: "",
    user_id: "",
    context: {
      type: "movie",
      data: {},
    },
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptData>({
    data: null,
    error: false,
    isLoading: false,
  });

  const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contextType = e.target.value as "movie" | "scene" | "shot";
    setRequest({
      ...request,
      context: {
        type: contextType,
        data: contextType === "movie" ? {} : {},
      },
    });
  };

  const addMessage = (
    data: AgentRequest | AgentResponse | PaymentApprovalMessage,
    isUser: boolean
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      data,
      isUser,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add user message to chat
    addMessage(request, true);

    // Show loading state
    setIsLoading(true);

    try {
      const response = await converseWithAgent(request);
      // Add agent response to chat
      addMessage(response, false);
    } catch (error) {
      addMessage(
        {
          content: {
            message: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
            price_in_credits: 0,
          },
          conversation_id: "error",
          message_type: "error",
          role: "assistant",
        },
        false
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewScript = async () => {
    if (!request.element_id) return;

    setScriptData((prev) => ({ ...prev, isLoading: true }));
    setIsScriptModalOpen(true);

    try {
      const script = await getScript(request.element_id);
      setScriptData({
        data: script,
        error: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load script:", error);
      setScriptData({
        data: null,
        error: true,
        isLoading: false,
      });
    }
  };

  const renderScriptModalContent = () => {
    if (scriptData.isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (scriptData.error) {
      return <div className="text-center text-gray-600 py-8">We couldn't load the script</div>;
    }

    if (scriptData.data) {
      return (
        <pre className="whitespace-pre-wrap text-left font-mono text-sm bg-gray-50 p-4 rounded">
          {JSON.stringify(scriptData.data, null, 2)}
        </pre>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Agent Request Form</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Message</label>
              <input
                type="text"
                value={request.message}
                onChange={(e) => setRequest({ ...request, message: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Enter your message"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700" htmlFor="element-type">
                Element Type
              </label>
              <input
                id="element-type"
                disabled
                type="text"
                value={request.element_type}
                className="w-full p-2 border rounded bg-gray-100"
                placeholder="Movie type is selected"
                title="Element type is fixed to Movie"
              />
            </div>
            <div>
              <label className="block text-gray-700">Root Element ID</label>
              <input
                type="text"
                value={request.root_element_id}
                onChange={(e) => setRequest({ ...request, root_element_id: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Enter root element ID"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Element ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={request.element_id}
                  onChange={(e) => setRequest({ ...request, element_id: e.target.value })}
                  className="flex-1 p-2 border rounded"
                  placeholder="Enter element ID"
                  required
                />
                <button
                  type="button"
                  onClick={handleViewScript}
                  disabled={!request.element_id}
                  className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  View Script
                </button>
              </div>
            </div>
            <div>
              <label className="block text-gray-700">User ID</label>
              <input
                type="text"
                value={request.user_id}
                onChange={(e) => setRequest({ ...request, user_id: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Enter user ID"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Context Type</label>
              <select
                value={request.context.type}
                onChange={handleContextChange}
                className="w-full p-2 border rounded"
                title="Select the context type for the request"
              >
                <option value="movie">Movie</option>
                <option value="scene">Scene</option>
                <option value="shot">Shot</option>
              </select>
            </div>
            {request.context.type === "scene" && (
              <div>
                <label className="block text-gray-700">Scene ID</label>
                <input
                  type="text"
                  value={request.context.data?.scene_id || ""}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      context: {
                        ...request.context,
                        data: { ...request.context.data, scene_id: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Enter scene ID"
                  required
                />
              </div>
            )}
            {request.context.type === "shot" && (
              <div>
                <label className="block text-gray-700">Shot ID</label>
                <input
                  type="text"
                  value={request.context.data?.shot_id || ""}
                  onChange={(e) =>
                    setRequest({
                      ...request,
                      context: {
                        ...request.context,
                        data: { ...request.context.data, shot_id: e.target.value },
                      },
                    })
                  }
                  className="w-full p-2 border rounded"
                  placeholder="Enter shot ID"
                  required
                />
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Chat Section */}
        <div className="h-[calc(100vh-3rem)]">
          <ChatView
            messages={messages}
            isLoading={isLoading}
            onNewMessage={addMessage}
            rootMovieId={request.root_element_id}
            userId={request.user_id}
          />
        </div>
      </div>

      {/* Script Modal */}
      <Modal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        title="Movie Script"
      >
        {renderScriptModalContent()}
      </Modal>
    </div>
  );
};

export default HomeScreen;
