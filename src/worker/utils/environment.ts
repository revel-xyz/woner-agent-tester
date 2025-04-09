import { Env } from "@/models/Env";

export default class Environment {
  static BACKEND_API_URL: string;
  static HALPRO_API_URL: string;
}

export const initializeEnvironment = (env: Env) => {
  console.log("initializeEnvironment", JSON.stringify(env));
  Environment.BACKEND_API_URL = env.BACKEND_API_URL;
  Environment.HALPRO_API_URL = env.HALPRO_API_URL;
};
