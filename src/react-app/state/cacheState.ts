import { observable } from "@legendapp/state";

interface CacheState {
  scripts: {
    [key: string]: Record<string, unknown>;
  };
}

export const cacheState = observable<CacheState>({
  scripts: {},
});

export const getScriptFromCache = (scriptId: string) => {
  return cacheState.scripts[scriptId].get();
};

export const setScriptInCache = (scriptId: string, script: Record<string, unknown>) => {
  cacheState.scripts[scriptId].set(script);
};
