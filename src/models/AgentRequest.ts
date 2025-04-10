import { ElementTyps } from "./enums";

export interface AgentRequest {
  message: string;
  element_type: ElementTyps;
  root_element_id: string;
  element_id: string;
  user_id: string;
  context: {
    type: "scene" | "shot" | "movie";
    data?: {
      scene_id?: string;
      shot_id?: string;
      movie_id?: string;
    };
  };
  tagged_elements: { id: string; name: string; type: ElementTyps; is_global: boolean }[];
}

export interface SavedAgentRequest extends AgentRequest {
  name: string;
}
