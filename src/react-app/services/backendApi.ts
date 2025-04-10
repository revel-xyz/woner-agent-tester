import { AgentRequest } from "@/models/AgentRequest";
import { AgentResponse } from "@/models/AgentResponse";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";
import { doc, getDoc } from "firebase/firestore/lite";
import { firestore } from "@/react-app/lib/firebase";
import { getEnvironment } from "@/react-app/state/appState";

function getBaseApiUrl() {
  const environment = getEnvironment();
  console.log("environment", environment);
  if (environment === "development") {
    return "https://woner-agent-tester-backend-api.nechmads.workers.dev";
  }
  return "http://localhost:5173";
}

export async function converseWithAgent(request: AgentRequest) {
  const response = await fetch(`${getBaseApiUrl()}/agent/converse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ request }),
  });

  const agentResponse: AgentResponse = await response.json();

  return agentResponse;
}

export async function approvePayment(message: PaymentApprovalMessage) {
  console.log("approvePayment", message);
  const response = await fetch(`${getBaseApiUrl()}/agent/approvePayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const agentResponse: AgentResponse = await response.json();

  return agentResponse;
}

export async function getAgentContext(conversationId: string) {
  const agentContextRef = doc(firestore, "agent_contexts", conversationId);
  const agentContextSnapshot = await getDoc(agentContextRef);
  const data = agentContextSnapshot.data();

  return data;
}

export async function getPendingChanges(paymentRequestId: string) {
  const purchaseOrderRef = doc(firestore, "purchase_orders", paymentRequestId);
  const purchaseOrderSnapshot = await getDoc(purchaseOrderRef);

  if (!purchaseOrderSnapshot.exists()) {
    return null;
  }

  const data = purchaseOrderSnapshot.data();

  console.log("data", data);
  return data?.data;
}

export async function getScript(movieId: string) {
  console.log("getScript", movieId);
  const response = await fetch(`${getBaseApiUrl()}/movies/getScript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ movieId }),
  });

  const script: AgentResponse = await response.json();

  return script;
}
