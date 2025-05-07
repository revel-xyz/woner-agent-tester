import { ContextType, ElementTyps } from "./enums";

export interface ConverseWithAgentRequest {
  message: string;
  element_type: ElementTyps;
  root_element_id: string;
  element_id: string;
  user_id: string;
  conversation_id?: string;

  context: {
    type: ContextType;
    data?: {
      scene_id?: string;
      shot_id?: string;
      character_id?: string;
      taggable_elements: [
        {
          id: string;
          name: string;
          type: ElementTyps;
          is_global: boolean;
        }
      ];
    };
  };
}
