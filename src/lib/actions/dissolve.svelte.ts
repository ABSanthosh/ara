export interface DissolveOptions {
  trigger?: boolean;
  onComplete?: () => void;
  duration?: number;
  maintainPosition?: boolean; // New option to prevent position changes
}

export function dissolve(
  element: HTMLElement,
  options: DissolveOptions = {}
) {
  let { trigger = false, onComplete, duration = 300, maintainPosition = true } = options;
  let isAnimating = false;
  let filter: SVGFilterElement | null = null;
  let displacementMap: SVGFEDisplacementMapElement | null = null;
  let filterId: string;
  let svg: SVGSVGElement | null = null;
  let originalGridArea: string | null = null;

  // Create the SVG filter for the dissolve effect
  function createDissolveFilter() {
    // Generate unique filter ID for this element
    filterId = `dissolve-filter-${Math.random().toString(36).substr(2, 9)}`;

    // Create SVG element and filter
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = `
      position: absolute;
      width: 0;
      height: 0;
      pointer-events: none;
    `;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');

    const turbulence = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    turbulence.setAttribute('type', 'fractalNoise');
    turbulence.setAttribute('baseFrequency', '1');
    turbulence.setAttribute('numOctaves', '2');
    turbulence.setAttribute('result', 'noise');

    displacementMap = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    displacementMap.setAttribute('in', 'SourceGraphic');
    displacementMap.setAttribute('in2', 'noise');
    displacementMap.setAttribute('scale', '0');
    displacementMap.setAttribute('xChannelSelector', 'R');
    displacementMap.setAttribute('yChannelSelector', 'G');

    filter.appendChild(turbulence);
    filter.appendChild(displacementMap);
    defs.appendChild(filter);
    svg.appendChild(defs);

    // Add to document
    document.body.appendChild(svg);
  }

  // Apply the dissolve effect to the element
  function applyDissolveFilter() {
    if (!filter) return;
    element.style.filter = `url(#${filterId})`;
    element.style.transformOrigin = 'center center';
  }

  // Remove the dissolve effect from the element
  function removeDissolveFilter() {
    element.style.filter = '';
    element.style.transform = '';
    element.style.opacity = '';
  }

  // Lock all sibling widgets in their current positions
  function lockSiblingPositions() {
    if (!maintainPosition) return;
    
    const container = element.closest('.widget-grid');
    if (!container) return;
    
    const siblings = container.querySelectorAll('[style*="grid-area"]');
    siblings.forEach((sibling) => {
      if (sibling === element) return; // Skip the element being removed
      
      const computedStyle = getComputedStyle(sibling as HTMLElement);
      const gridArea = computedStyle.gridArea;
      
      if (gridArea && gridArea !== 'auto') {
        // Store the current grid-area to prevent any changes
        (sibling as HTMLElement).style.gridArea = gridArea;
        // Add a data attribute to mark as position-locked
        (sibling as HTMLElement).setAttribute('data-position-locked', 'true');
      }
    });
  }

  // Unlock sibling positions after removal is complete
  function unlockSiblingPositions() {
    if (!maintainPosition) return;
    
    // Use a longer delay to ensure the element is fully removed from DOM
    setTimeout(() => {
      const container = document.querySelector('.widget-grid');
      if (!container) return;
      
      const lockedElements = container.querySelectorAll('[data-position-locked="true"]');
      lockedElements.forEach((element) => {
        (element as HTMLElement).removeAttribute('data-position-locked');
        // Don't remove the grid-area style as it should maintain the position
      });
    }, 200);
  }

  // Animate the dissolve effect
  function animateDissolve() {
    if (isAnimating || !displacementMap) return;
    isAnimating = true;

    // Lock other widgets in their positions before starting animation
    lockSiblingPositions();

    // Apply filter only when animation starts
    applyDissolveFilter();

    const opacityStart = 0.5; // Start opacity reduction halfway through animation
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear Progress Calculation
      const linearProgress = progress;

      // Update displacement map for dissolve effect
      const displacementScale = linearProgress * 180;
      displacementMap!.setAttribute('scale', displacementScale.toString());

      // Scale effect from 1 to 1.3
      const scaleFactor = 1 + 0.3 * linearProgress;
      element.style.transform = `scale(${scaleFactor})`;

      // Adjust opacity, reducing after halfway point
      let opacity = 1;
      if (progress > opacityStart) {
        const fadeProgress = (progress - opacityStart) / (1 - opacityStart);
        opacity = 1 - fadeProgress;
      }
      element.style.opacity = opacity.toString();

      // Continue animation or complete when done
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete, call onComplete after a brief delay
        setTimeout(() => {
          isAnimating = false;
          onComplete?.();
          // Unlock positions after removal is complete
          unlockSiblingPositions();
        }, 100);
      }
    }

    requestAnimationFrame(animate);
  }

  // Initialize the filter
  createDissolveFilter();
  
  // Store original grid area for restoration if needed
  originalGridArea = element.style.gridArea || getComputedStyle(element).gridArea;

  // Start animation if trigger is true
  if (trigger) {
    animateDissolve();
  }

  return {
    update(newOptions: DissolveOptions) {
      const oldTrigger = trigger;
      ({ trigger = false, onComplete, duration = 300, maintainPosition = true } = newOptions);
      
      // If trigger changed from false to true, start animation
      if (!oldTrigger && trigger) {
        animateDissolve();
      }
    },
    destroy() {
      removeDissolveFilter();
      // Remove the unique SVG filter from DOM
      if (svg && svg.parentNode) {
        svg.parentNode.removeChild(svg);
      }
      // Ensure positions are unlocked on destroy
      unlockSiblingPositions();
    },
  };
}
