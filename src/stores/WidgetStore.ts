import { writable } from "svelte/store";

export interface Widget {
  name: string;
  x: number;
  y: number;
}

const initialWidgets = {
  "1": {
    name: "clock-analog",
    x: 0,
    y: 0,
  },
  "2": {
    name: "clock-flip",
    x: 1,
    y: 0,
  },
  "3": {
    name: "notes",
    x: 0,
    y: 1,
  },
  "4": {
    name: "cat-reddit",
    x: 1,
    y: 1,
  },
  "5": {
    name: "empty",
    x: 1,
    y: 1,
  },
  "6": {
    name: "empty",
    x: 1,
    y: 1,
  },
  "7": {
    name: "empty",
    x: 1,
    y: 1,
  },
  "8": {
    name: "empty",
    x: 1,
    y: 1,
  },
};

const defaultStore = {
  options: {
    reordering: true,
  },
  widgets: initialWidgets,
};

const widgetStore = writable<{
  options: {
    reordering: boolean;
  };
  widgets: {
    [key: string]: Widget;
  };
}>(JSON.parse(window.localStorage.getItem("widgetStore")!) ?? defaultStore);

let timer: NodeJS.Timeout | null;

widgetStore.subscribe((value) => {
  clearTimeout(timer as NodeJS.Timeout);
  timer = setTimeout(() => {
    window.localStorage.setItem("widgetStore", JSON.stringify(value));
  }, 1000);
});

export default widgetStore;
