import Environment from "@/worker/utils/environment";
import { AgentRequest } from "@/models/AgentRequest";
import { AgentResponse } from "@/models/AgentResponse";
import { PaymentApprovalMessage } from "@/models/PaymentApprovalMessage";

export async function converse(request: AgentRequest) {
  console.log(JSON.stringify(request));

  console.log("conversing with agent", Environment.BACKEND_API_URL);
  const response = await fetch(`${Environment.BACKEND_API_URL}/converse_with_agent_on_movie`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to converse with agent");
  }

  const reply = (await response.json()) as AgentResponse;

  return reply;
}

export async function approvePayment(message: PaymentApprovalMessage) {
  console.log("approvePayment", message);
  const response = await fetch(`${Environment.BACKEND_API_URL}/approve_purchase_order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error("Failed to approve payment");
  }

  const reply = (await response.json()) as AgentResponse;

  return reply;
}

export async function getScript(movieId: string) {
  const response = await fetch(`${Environment.HALPRO_API_URL}/v1-agent-movie-getScript`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ movieId }),
  });

  if (!response.ok) {
    throw new Error("Failed to get script");
  }

  const script = (await response.json()) as AgentResponse;

  return script;
}
