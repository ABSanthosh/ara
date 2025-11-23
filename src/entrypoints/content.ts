import hotkeys from "hotkeys-js";

export default defineContentScript({
  // matches: ["<all_urls>"],
  matches: ["*://*/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    // const ui = await createShadowRootUi(ctx, {
    //   name: "unitab-spotlight",
    //   position: "inline",
    //   anchor: "body",
    //   append: "last",
    //   onMount: async (container) => {
    //     // Dynamically import Svelte and the component
    //     const { mount } = await import("svelte");
    //     const { default: Spotlight } = await import(
    //       "@/lib/components/Spotlight.svelte"
    //     );
    //     // Mount the component
    //     mount(Spotlight, { target: container });
    //   },
    // });
    // await ui.mount();
    // // Handle keyboard shortcut at the page level (outside shadow DOM)

    // hotkeys("alt+space", function (event) {
    //   event.preventDefault();
    //   window.dispatchEvent(new CustomEvent("toggle-spotlight"));
    // });
  },
});
