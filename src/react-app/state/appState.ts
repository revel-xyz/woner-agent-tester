import { observable } from "@legendapp/state";
import { AgentRequest, SavedAgentRequest } from "@/models/AgentRequest";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { syncObservable } from "@legendapp/state/sync";

interface AppState {
  xRayMode: boolean;
  savedRequests: SavedAgentRequest[];
}

export const appDataState = observable<AppState>({
  xRayMode: false,
  savedRequests: [],
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

export const addSavedRequest = (request: AgentRequest, name: string) => {
  appDataState.savedRequests.set([...appDataState.savedRequests.get(), { ...request, name }]);
};
