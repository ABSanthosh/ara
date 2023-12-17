import { writable } from "svelte/store";

export interface Widget {
  enabled: boolean;
  id: string;
  name: string;
  desc: string;
  icon: string;
  x: number;
  y: number;
}

const widgets = {
  "clock-analog": {
    enabled: true,
    id: "clock-analog",
    name: "Analog Clock",
    desc: "A simple analog clock",
    icon: "/assets/Images/clock-analog.svg",
    x: 0,
    y: 0,
  },
  "clock-flip": {
    enabled: true,
    id: "clock-flip",
    name: "Flip Clock",
    desc: "A simple flip clock",
    icon: "/assets/Images/clock-flip.svg",
    x: 0,
    y: 0,
  },
  "notes": {
    id: "notes",
    enabled: true,
    name: "Notes",
    desc: "Take notes in markdown!",
    icon: "/assets/Images/notes.svg",
    x: 0,
    y: 0,
  },
  "cat-reddit": {
    enabled: true,
    id: "cat-reddit",
    name: "Cats from Reddit",
    desc: "Random cat pictures from Reddit",
    icon: "/assets/Images/cat-reddit.svg",
    x: 0,
    y: 0,
  }
}

const defaultStore = {
  settings: {},
  options: {
    reordering: true,
  },
  widgets: widgets,
};

const settingStore = writable<{
  options: {
    reordering: boolean;
  };
  widgets: {
    [key: string]: Widget;
  };
}>(JSON.parse(window.localStorage.getItem("settingStore")!) ?? defaultStore);

if (!window.localStorage.getItem("settingStore")) {
  window.localStorage.setItem("settingStore", JSON.stringify(defaultStore));
}

let timer: NodeJS.Timeout | null;

settingStore.subscribe((value) => {
  clearTimeout(timer as NodeJS.Timeout);
  timer = setTimeout(() => {
    window.localStorage.setItem("settingStore", JSON.stringify(value));
  }, 1000);
});

export default settingStore;
