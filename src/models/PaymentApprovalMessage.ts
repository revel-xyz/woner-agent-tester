export interface PaymentApprovalMessage {
  conversation_id: string;
  root_movie_id: string;
  payment_request_id: string;
  is_approved: boolean;
  user_id: string;
}
