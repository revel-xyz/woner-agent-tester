type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

export interface AgentResponse {
  content: {
    message: string;
    price_in_credits: number;
  };
  conversation_id: string;
  message_type: string;
  role: string;
  payment_request_id?: string;
  is_approved?: boolean;
  is_enabled?: boolean;
  task_data?: object;
  script_changes?: JSONValue;
}
