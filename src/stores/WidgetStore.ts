import { writable } from "svelte/store";

const defaultWidgets = [
  {
    id: "analog-clock",
    name: "Analog Clock",
    description: "A simple analog clock.",
  },
];

interface Widgets {
  options: {};
  occupiedSpots: boolean[][];
  widgets: (typeof defaultWidgets)[0];
}

const widgetStore = writable<Widgets>({
  options: {},
  occupiedSpots: [],
  widgets: defaultWidgets[0],
});

export default widgetStore;