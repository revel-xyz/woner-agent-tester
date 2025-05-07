export interface PaymentApprovalMessage {
  conversation_id: string;
  root_element_id: string;
  purchase_order_id: string;
  is_approved: boolean;
  user_id: string;
}
