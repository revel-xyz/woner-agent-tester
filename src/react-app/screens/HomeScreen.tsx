import React, { useState } from "react";
import { AgentRequest } from "@/models/AgentRequest";
import { converseWithAgent, getScript } from "@/react-app/services/backendApi";
import { ElementTyps } from "@/models/enums";
import { ChatView } from "@/react-app/components/ChatView";
import { AgentResponse } from "@/models/AgentResponse";
import { Modal } from "@/react-app/components/Modal";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";
import { toast } from "sonner";
import { addSavedRequest, useSavedRequests } from "@/react-app/state/appState";

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

interface TaggedElementFormData {
  id: string;
  name: string;
  type: ElementTyps;
  is_global: boolean;
}

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
    tagged_elements: [],
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isSaveRequestModalOpen, setIsSaveRequestModalOpen] = useState(false);
  const [requestName, setRequestName] = useState("");
  const [selectedSavedRequest, setSelectedSavedRequest] = useState("");
  const savedRequests = useSavedRequests();
  const [scriptData, setScriptData] = useState<ScriptData>({
    data: null,
    error: false,
    isLoading: false,
  });

  // State for tagged element form
  const [showTaggedElementForm, setShowTaggedElementForm] = useState(false);
  const [taggedElementForm, setTaggedElementForm] = useState<TaggedElementFormData>({
    id: "",
    name: "",
    type: ElementTyps.CHARACTER,
    is_global: false,
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

  // Handle adding a new tagged element
  const handleAddTaggedElement = () => {
    // Validate form data
    if (!taggedElementForm.id || !taggedElementForm.name) {
      return;
    }

    // Add the new tagged element to the request
    setRequest({
      ...request,
      tagged_elements: [...request.tagged_elements, taggedElementForm],
    });

    // Reset form and hide it
    setTaggedElementForm({
      id: "",
      name: "",
      type: ElementTyps.CHARACTER,
      is_global: false,
    });
    setShowTaggedElementForm(false);
  };

  // Handle removing a tagged element
  const handleRemoveTaggedElement = (id: string) => {
    setRequest({
      ...request,
      tagged_elements: request.tagged_elements.filter((element) => element.id !== id),
    });
  };

  const handleLoadSavedRequest = () => {
    if (!selectedSavedRequest) {
      toast.error("Please select a saved request");
      return;
    }

    const savedRequest = savedRequests.find((req) => req.name === selectedSavedRequest);
    if (savedRequest) {
      setRequest({
        message: savedRequest.message,
        element_type: savedRequest.element_type,
        root_element_id: savedRequest.root_element_id,
        element_id: savedRequest.element_id,
        user_id: savedRequest.user_id,
        context: savedRequest.context,
        tagged_elements: savedRequest.tagged_elements,
      });
      toast.success(`Loaded request: ${savedRequest.name}`);
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
      const scriptJson = JSON.stringify(scriptData.data, null, 2);

      const handleCopyToClipboard = () => {
        navigator.clipboard
          .writeText(scriptJson)
          .then(() => {
            toast.success("Script copied to clipboard");
          })
          .catch((err) => {
            console.error("Failed to copy script: ", err);
            toast.error("Failed to copy script");
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Saved Requests Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Saved Requests</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="saved-requests-select" className="sr-only">
                Select a saved request
              </label>
              <select
                id="saved-requests-select"
                value={selectedSavedRequest}
                onChange={(e) => setSelectedSavedRequest(e.target.value)}
                className="w-full p-2 border rounded"
                aria-label="Select a saved request"
              >
                <option value="">Select a saved request</option>
                {savedRequests.map((savedReq) => (
                  <option key={savedReq.name} value={savedReq.name}>
                    {savedReq.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={handleLoadSavedRequest}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
              disabled={!selectedSavedRequest}
            >
              Load Request
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Agent Request Form</h1>
              <button
                type="button"
                onClick={() => setIsSaveRequestModalOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                Save Request
              </button>
            </div>
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

              {/* Tagged Elements Section */}
              <div className="border-t pt-4 mt-4">
                <h2 className="text-lg font-semibold mb-2">Tagged Elements</h2>

                {/* List of tagged elements */}
                {request.tagged_elements.length > 0 ? (
                  <div className="mb-4 space-y-2">
                    {request.tagged_elements.map((element) => (
                      <div
                        key={element.id}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <div>
                          <span className="font-medium">{element.name}</span>
                          <span className="text-sm text-gray-500 ml-2">({element.type})</span>
                          {element.is_global && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded ml-2">
                              Global
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTaggedElement(element.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-4">No tagged elements added yet.</p>
                )}

                {/* Add Tagged Element Button */}
                {!showTaggedElementForm && (
                  <button
                    type="button"
                    onClick={() => setShowTaggedElementForm(true)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    Tag Element
                  </button>
                )}

                {/* Tagged Element Form */}
                {showTaggedElementForm && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <h3 className="font-medium mb-3">Add Tagged Element</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700">ID</label>
                        <input
                          type="text"
                          value={taggedElementForm.id}
                          onChange={(e) =>
                            setTaggedElementForm({ ...taggedElementForm, id: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          placeholder="Enter element ID"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Name</label>
                        <input
                          type="text"
                          value={taggedElementForm.name}
                          onChange={(e) =>
                            setTaggedElementForm({ ...taggedElementForm, name: e.target.value })
                          }
                          className="w-full p-2 border rounded"
                          placeholder="Enter element name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Type</label>
                        <select
                          value={taggedElementForm.type}
                          onChange={(e) =>
                            setTaggedElementForm({
                              ...taggedElementForm,
                              type: e.target.value as ElementTyps,
                            })
                          }
                          className="w-full p-2 border rounded"
                          title="Select the element type"
                        >
                          <option value={ElementTyps.CHARACTER}>CHARACTER</option>
                          <option value={ElementTyps.PROP}>PROP</option>
                          <option value={ElementTyps.SET}>SET</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is-global"
                          checked={taggedElementForm.is_global}
                          onChange={(e) =>
                            setTaggedElementForm({
                              ...taggedElementForm,
                              is_global: e.target.checked,
                            })
                          }
                          className="mr-2"
                        />
                        <label htmlFor="is-global" className="text-sm text-gray-700">
                          Is Global
                        </label>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleAddTaggedElement}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTaggedElementForm(false)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

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
      </div>

      {/* Script Modal */}
      <Modal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
        title="Movie Script"
      >
        {renderScriptModalContent()}
      </Modal>

      {/* Save Request Modal */}
      <Modal
        isOpen={isSaveRequestModalOpen}
        onClose={() => setIsSaveRequestModalOpen(false)}
        title="Save Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Request Name</label>
            <input
              type="text"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter a name for this request"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsSaveRequestModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (requestName.trim()) {
                  addSavedRequest(request, requestName);
                  toast.success("Request saved successfully!");
                  setRequestName("");
                  setIsSaveRequestModalOpen(false);
                } else {
                  toast.error("Please enter a name for the request");
                }
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomeScreen;
