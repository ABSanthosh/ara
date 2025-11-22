export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'unitab-spotlight',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount: async (container) => {
        // Dynamically import Svelte and the component
        const { mount } = await import('svelte');
        const { default: Spotlight } = await import('@/lib/components/Spotlight.svelte');
        
        // Mount the component
        mount(Spotlight, { target: container });
      },
    });

    await ui.mount();

    // Handle keyboard shortcut at the page level (outside shadow DOM)
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        
        // Dispatch custom event to toggle spotlight
        const event = new CustomEvent('toggle-spotlight');
        window.dispatchEvent(event);
      }
    };

    // Add event listener to the main document
    document.addEventListener('keydown', handleKeydown, { capture: true });

    console.log('Spotlight search initialized. Press Alt+Space to open.');
  },
});
