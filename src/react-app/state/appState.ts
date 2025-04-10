import { observable } from "@legendapp/state";

interface AppState {
  xRayMode: boolean;
}

export const appDataState = observable<AppState>({
  xRayMode: false,
});

export const useXRayMode = () => appDataState.xRayMode.get();

export const toggleXRayMode = () => {
  appDataState.xRayMode.set(!appDataState.xRayMode.get());
};
