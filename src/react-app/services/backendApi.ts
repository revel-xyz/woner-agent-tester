import { AgentRequest } from "@/models/AgentRequest";
import { AgentResponse } from "@/models/AgentResponse";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";
import { collection, doc, getDoc, getDocs } from "firebase/firestore/lite";
import { firestore } from "@/react-app/lib/firebase";

export async function converseWithAgent(request: AgentRequest) {
  const response = await fetch(`${import.meta.env.VITE_BASE_API_URL}/agent/converse`, {
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
  const response = await fetch(`${import.meta.env.VITE_BASE_API_URL}/agent/approvePayment`, {
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
  const response = await fetch(`${import.meta.env.VITE_BASE_API_URL}/movies/getScript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ movieId }),
  });

  const script: AgentResponse = await response.json();

  return script;
}
