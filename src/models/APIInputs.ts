import { AgentRequest } from "./AgentRequest";

export interface AgentConverseAPIInput {
  request: AgentRequest;
}

export interface AgentResponseToPaymentRequestAPIInput {
  message: {
    conversation_id: string;
    root_element_id: string;
    purchase_order_id: string;
    is_approved: boolean;
    user_id: string;
  };
}

export interface GetScriptAPIInput {
  movieId: string;
}
