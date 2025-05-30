import React, { useState, useEffect } from "react";
import { converseWithAgent, getScript, getTaggableElements } from "@/react-app/services/backendApi";
import { ContextType, ElementTyps } from "@/models/enums";
import { ChatView } from "@/react-app/components/ChatView";
import { AgentResponse } from "@/models/AgentResponse";
import { Modal } from "@/react-app/components/Modal";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";
import { toast } from "sonner";
import {
  addSavedRequest,
  useSavedRequests,
  setEnvironment,
  getEnvironment,
} from "@/react-app/state/appState";
import { ConverseWithAgentRequest } from "@/models/ConverseWithAgentRequest";
import { AgentConverseResponse, AgentConverseMessageType } from "@/models/AgentConverseResponse";

interface Message {
  id: string;
  isUser: boolean;
  timestamp: string;
  data: ConverseWithAgentRequest | AgentConverseResponse | PaymentApprovalMessage;
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

interface TaggableElement {
  id: string;
  name: string;
  type: ElementTyps;
  uiName: string;
  is_global: boolean;
}

const HomeScreen: React.FC = () => {
  const [request, setRequest] = useState<ConverseWithAgentRequest>({
    message: "",
    element_type: ElementTyps.MOVIE,
    root_element_id: "",
    element_id: "",
    user_id: "",
    context: {
      type: ContextType.MOVIE,
      data: {
        taggable_elements: [
          {
            id: "",
            name: "",
            type: ElementTyps.MOVIE,
            is_global: false,
          },
        ],
      },
    },
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
  const [taggableElements, setTaggableElements] = useState<TaggableElement[]>([]);
  const [isLoadingTaggableElements, setIsLoadingTaggableElements] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string>("");

  const [environment, setEnvironmentState] = useState(getEnvironment());

  const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contextType = e.target.value as ContextType;
    setRequest({
      ...request,
      context: {
        type: contextType,
        data: contextType === ContextType.MOVIE ? {} : {},
      },
    });
  };

  const addMessage = (
    data: ConverseWithAgentRequest | AgentConverseResponse | PaymentApprovalMessage,
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
    addMessage(request, true);
    setIsLoading(true);
    try {
      const response = await converseWithAgent(request);
      addMessage(response, false);
    } catch (error) {
      addMessage(
        {
          message: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
          enhanced_message: "",
          role: "agent",
          message_type: AgentConverseMessageType.AGENT_MESSAGE,
          data: {},
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

  // Function to fetch taggable elements
  const fetchTaggableElements = async (elementType: ElementTyps) => {
    if (!request.element_id) {
      console.error("Cannot fetch taggable elements: No element_id provided");
      return;
    }

    setIsLoadingTaggableElements(true);
    try {
      console.log(`Fetching taggable elements for ${request.element_id} with type ${elementType}`);
      const elements = await getTaggableElements(request.element_id, elementType);
      console.log("Fetched elements:", elements);

      // Log each element's structure to debug
      elements.forEach((el, index) => {
        console.log(`Element ${index}:`, {
          id: el.id,
          name: el.name,
          type: el.type,
          is_global: el.is_global,
          uiName: el.uiName,
          fullElement: el,
        });
      });

      setTaggableElements(elements);
    } catch (error) {
      console.error("Failed to fetch taggable elements:", error);
      toast.error("Failed to load taggable elements");
    } finally {
      setIsLoadingTaggableElements(false);
    }
  };

  // Function to handle type change in the form
  const handleTaggedElementTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ElementTyps;
    setTaggedElementForm({
      ...taggedElementForm,
      type: newType,
      id: "",
      name: "",
      is_global: false,
    });
    setSelectedElementId("");

    fetchTaggableElements(newType);
  };

  // Function to handle element selection from combo box
  const handleElementSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    console.log(`handleElementSelection: Selected element ID: ${selectedId}`);

    if (!selectedId) {
      // Clear form if no selection
      setSelectedElementId("");
      setTaggedElementForm({
        ...taggedElementForm,
        id: "",
        name: "",
        is_global: false,
      });
      return;
    }

    setSelectedElementId(selectedId);

    // Find the selected element in the taggableElements array
    console.log("Looking for element with id:", selectedId);
    console.log(
      "Available elements:",
      taggableElements.map((e) => ({ id: e.id, name: e.name }))
    );

    const selectedElement = taggableElements.find((el) => el.id === selectedId);
    console.log("Selected element:", selectedElement);

    if (selectedElement) {
      // Update form with selected element data
      setTaggedElementForm({
        ...taggedElementForm,
        id: selectedElement.id,
        name: selectedElement.name,
        is_global: selectedElement.is_global,
      });
    } else {
      console.error("Could not find element with id:", selectedId);
    }
  };

  // Update the useEffect to fetch taggable elements when the form is shown
  useEffect(() => {
    if (showTaggedElementForm && request.element_id) {
      fetchTaggableElements(taggedElementForm.type);
    }
  }, [showTaggedElementForm, request.element_id]);

  // Handle removing a tagged element
  const handleRemoveTaggedElement = (id: string) => {
    setRequest({
      ...request,
      context: {
        ...request.context,
        data: {
          ...request.context.data,
          taggable_elements: [
            {
              id: "",
              name: "",
              type: ElementTyps.MOVIE,
              is_global: false,
            },
          ],
        },
      },
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
      });
      toast.success(`Loaded request: ${savedRequest.name}`);
    }
  };

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newEnvironment = e.target.value as "development" | "local";
    setEnvironment(newEnvironment);
    setEnvironmentState(newEnvironment);
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
        {/* Tester Config Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Tester Config</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="environment-select"
                className="text-base font-medium text-gray-700 whitespace-nowrap"
              >
                Connect to environment:
              </label>
              <select
                id="environment-select"
                value={environment}
                onChange={handleEnvironmentChange}
                className="w-40 p-2 border rounded"
              >
                <option value="local">local</option>
                <option value="development">development</option>
              </select>
            </div>
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
                  <option value={ContextType.MOVIE}>Movie</option>
                  <option value={ContextType.SCENE}>Scene</option>
                  <option value={ContextType.SHOT}>Shot</option>
                </select>
              </div>
              {request.context.type === "SCENE" && (
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
              {request.context.type === "SHOT" && (
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
                {request.context.data &&
                request.context.data.taggable_elements &&
                request.context.data.taggable_elements[0] &&
                request.context.data.taggable_elements[0].id !== "" ? (
                  <div className="mb-4 space-y-2">
                    <div
                      key={request.context.data.taggable_elements[0].id}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span>{request.context.data.taggable_elements[0].name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveTaggedElement(request.context.data!.taggable_elements[0].id)
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Add Tagged Element Button */}
                {!showTaggedElementForm && (
                  <button
                    type="button"
                    onClick={async () => {
                      setShowTaggedElementForm(true);
                    }}
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
                        <label className="block text-sm text-gray-700">Type</label>
                        <select
                          value={taggedElementForm.type}
                          onChange={handleTaggedElementTypeChange}
                          className="w-full p-2 border rounded"
                          title="Select the element type"
                        >
                          <option value={ElementTyps.CHARACTER}>CHARACTER</option>
                          <option value={ElementTyps.PROP}>PROP</option>
                          <option value={ElementTyps.SET}>SET</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700">Element</label>
                        {isLoadingTaggableElements ? (
                          <div className="w-full p-2 border rounded bg-gray-100 text-gray-500">
                            Loading elements...
                          </div>
                        ) : taggableElements.length > 0 ? (
                          <select
                            value={selectedElementId}
                            onChange={handleElementSelection}
                            className="w-full p-2 border rounded"
                            title="Select an element"
                          >
                            <option value="">Select an element</option>
                            {taggableElements.map((element) => {
                              console.log(
                                `Rendering option: id=${element.id}, name=${element.name}, uiName=${element.uiName}`
                              );
                              return (
                                <option key={element.id} value={element.id}>
                                  {element.uiName}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <div className="w-full p-2 border rounded bg-gray-100 text-gray-500">
                            No elements available for this type
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            // Check if an element is selected
                            if (!selectedElementId) {
                              toast.error("Please select an element");
                              return;
                            }

                            // Ensure form is filled with the selected element data
                            const selectedElement = taggableElements.find(
                              (el) => el.id === selectedElementId
                            );

                            if (!selectedElement) {
                              toast.error("Selected element not found");
                              return;
                            }

                            // Update form with selected element data (in case it wasn't already)
                            const updatedForm = {
                              id: selectedElement.id,
                              name: selectedElement.name,
                              type: selectedElement.type,
                              is_global: selectedElement.is_global,
                            };

                            // Add the new tagged element to the request
                            setRequest({
                              ...request,
                              context: {
                                ...request.context,
                                data: {
                                  ...request.context.data,
                                  taggable_elements: [updatedForm],
                                },
                              },
                            });

                            // Reset form and hide it
                            setTaggedElementForm({
                              id: "",
                              name: "",
                              type: ElementTyps.CHARACTER,
                              is_global: false,
                            });
                            setSelectedElementId("");
                            setShowTaggedElementForm(false);

                            toast.success("Element added successfully");
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                          disabled={!selectedElementId}
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
