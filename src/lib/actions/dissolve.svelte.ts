export interface DissolveOptions {
  onComplete?: () => void;
  duration?: number;
  maintainPosition?: boolean;
}

export function dissolve(
  element: HTMLElement,
  options: DissolveOptions = {}
): Promise<void> {
  const { onComplete, duration = 300, maintainPosition = true } = options;
  
  return new Promise((resolve) => {
    let filter: SVGFilterElement | null = null;
    let displacementMap: SVGFEDisplacementMapElement | null = null;
    let filterId: string;
    let svg: SVGSVGElement | null = null;

    // Create the SVG filter for the dissolve effect
    function createDissolveFilter() {
      filterId = `dissolve-filter-${Math.random().toString(36).substr(2, 9)}`;

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

      document.body.appendChild(svg);
    }

    // Lock all sibling widgets in their current positions
    function lockSiblingPositions() {
      // Disabled - let CSS Grid handle natural reflow
      return;
    }

    // Unlock sibling positions after removal is complete
    function unlockSiblingPositions() {
      // Disabled - let CSS Grid handle natural reflow
      return;
    }

    // Cleanup function
    function cleanup() {
      element.style.filter = '';
      element.style.transform = '';
      element.style.opacity = '';
      
      if (svg && svg.parentNode) {
        svg.parentNode.removeChild(svg);
      }
      
      unlockSiblingPositions();
    }

    // Start the animation
    function startAnimation() {
      createDissolveFilter();
      lockSiblingPositions();
      
      element.style.filter = `url(#${filterId})`;
      element.style.transformOrigin = 'center center';

      const opacityStart = 0.5;
      const startTime = performance.now();

      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const displacementScale = progress * 180;
        displacementMap!.setAttribute('scale', displacementScale.toString());

        const scaleFactor = 1 + 0.3 * progress;
        element.style.transform = `scale(${scaleFactor})`;

        let opacity = 1;
        if (progress > opacityStart) {
          const fadeProgress = (progress - opacityStart) / (1 - opacityStart);
          opacity = 1 - fadeProgress;
        }
        element.style.opacity = opacity.toString();

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            cleanup();
            // Add a small delay before calling onComplete to ensure smooth transition
            setTimeout(() => {
              onComplete?.();
            }, 50);
            resolve();
          }, 100);
        }
      }

      requestAnimationFrame(animate);
    }

    startAnimation();
  });
}
