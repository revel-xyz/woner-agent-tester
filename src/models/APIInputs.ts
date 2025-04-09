import { AgentRequest } from "./AgentRequest";

export interface AgentConverseAPIInput {
  request: AgentRequest;
}

export interface AgentResponseToPaymentRequestAPIInput {
  message: {
    conversation_id: string;
    root_movie_id: string;
    payment_request_id: string;
    is_approved: boolean;
    user_id: string;
  };
}

export interface GetScriptAPIInput {
  movieId: string;
}
