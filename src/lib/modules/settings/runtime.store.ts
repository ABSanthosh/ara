import { writable } from "svelte/store";

type TRuntimeStore = {
  internal: {
    grid: {
      element: HTMLElement;
    };
  };
}

const defaultStore: TRuntimeStore = {
  internal: {
    grid: {
      element: document.createElement("div"),
    },
  },
};

export const RuntimeStore = writable<TRuntimeStore>(defaultStore);
