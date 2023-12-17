import { writable } from "svelte/store";

const defaultOptions = {
  sidebarIsClosed: false,
};

const initialValue =
  JSON.parse(window.localStorage.getItem("options")!) ?? defaultOptions;

if (!window.localStorage.getItem("options")) {
  window.localStorage.setItem("options", JSON.stringify(initialValue));
}

const options = writable<typeof defaultOptions>(
  initialValue as typeof defaultOptions
);

options.subscribe((value) => {
  window.localStorage.setItem("options", JSON.stringify(value));
});

export default options;
