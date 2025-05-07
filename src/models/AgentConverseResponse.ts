export enum AgentConverseMessageType {
  USER_MESSAGE = "USER_MESSAGE",
  AGENT_MESSAGE = "AGENT_MESSAGE",
  PAYMENT_REQUEST = "PAYMENT_REQUEST",
  ERROR = "ERROR",
}

export interface AgentConverseResponse {
  message: string;
  enhanced_message: string;
  role: "agent" | "user";
  message_type: AgentConverseMessageType;
  data: {
    purchase_order_id?: string;
  };
}
