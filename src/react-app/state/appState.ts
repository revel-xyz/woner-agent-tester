import { observable } from "@legendapp/state";
import { ConverseWithAgentRequest } from "@/models/ConverseWithAgentRequest";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { syncObservable } from "@legendapp/state/sync";

interface AppState {
  xRayMode: boolean;
  savedRequests: (ConverseWithAgentRequest & { name: string })[];
  environment: "development" | "local";
}

export const appDataState = observable<AppState>({
  xRayMode: false,
  savedRequests: [],
  environment: "development",
});

syncObservable(appDataState, {
  persist: {
    name: "appDataState",
    plugin: ObservablePersistLocalStorage,
  },
});

export const useXRayMode = () => appDataState.xRayMode.get();
export const useSavedRequests = () => appDataState.savedRequests.get();

export const toggleXRayMode = () => {
  appDataState.xRayMode.set(!appDataState.xRayMode.get());
};

export const addSavedRequest = (request: ConverseWithAgentRequest, name: string) => {
  appDataState.savedRequests.set([...appDataState.savedRequests.get(), { ...request, name }]);
};

export const setEnvironment = (environment: "development" | "local") => {
  console.log("setting environment", environment);
  appDataState.environment.set(environment);
};

export const getEnvironment = () => appDataState.environment.get();
