export function curvedScroll(wrapper: HTMLElement, options = {}) {
  if (!CSS.supports("animation-timeline: scroll()")) return;

  const config = {
    radius: 28,
    stroke: 5,
    inset: 6,
    trail: 18,
    thumb: 70,
    color: "currentColor",
    alpha: 0.9,
    ...options,
  };

  // The first child becomes the scroll container
  const scroller = wrapper.firstElementChild as HTMLElement;
  if (!scroller) return;

  wrapper.style.position ||= "relative";
  scroller.style.overflow = "auto";
  (scroller.style as any).scrollTimeline = "--curved-scroll";

  // Hide native scrollbar
  scroller.style.scrollbarWidth = "none";
  (scroller.style as any)["msOverflowStyle"] = "none";
  scroller.style.setProperty("--webkit-scrollbar", "none");

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.right = "0";
  svg.style.bottom = "0";
  svg.style.width = `${config.radius * 2}px`;
  svg.style.pointerEvents = "none";
  svg.style.overflow = "visible";

  const track = document.createElementNS(
    svg.namespaceURI,
    "path"
  ) as SVGPathElement;
  const thumb = document.createElementNS(
    svg.namespaceURI,
    "path"
  ) as SVGPathElement;

  for (const p of [track, thumb]) {
    p.setAttribute("fill", "none");
    p.setAttribute("stroke-linecap", "round");
  }

  track.style.stroke = `hsl(0 0% 100% / 0.15)`;
  thumb.style.stroke = config.color;
  thumb.style.opacity = `${config.alpha}`;

  svg.append(track, thumb);
  wrapper.append(svg);

  let resizeObserver: ResizeObserver;

  function sync() {
    const height = scroller.clientHeight;
    const r = config.radius;
    const pad = config.inset + config.stroke * 0.5;
    const inner = Math.max(0, r - pad);
    const mid = r;
    const right = r * 2 - pad;

    svg.setAttribute("viewBox", `0 0 ${r * 2} ${height}`);

    const d = `
      M${mid - config.trail},${pad}
      ${
        inner
          ? `L${mid},${pad} a${inner},${inner} 0 0 1 ${inner} ${inner}`
          : `L${right},${pad}`
      }
      L${right},${height - pad - inner}
      ${
        inner
          ? `a${inner},${inner} 0 0 1 ${-inner} ${inner}`
          : `L${right},${height - pad}`
      }
      L${mid - config.trail},${height - pad}
    `;

    track.setAttribute("d", d);
    thumb.setAttribute("d", d);

    const length = track.getTotalLength();

    thumb.style.strokeWidth = `${config.stroke}px`;
    track.style.strokeWidth = `${config.stroke}px`;

    thumb.style.strokeDasharray = `${config.thumb} ${length}`;
    thumb.style.strokeDashoffset = "0";

    wrapper.style.setProperty("--track-length", `${length}`);
  }

  resizeObserver = new ResizeObserver(sync);
  resizeObserver.observe(scroller);
  sync();

  const style = document.createElement("style");
  style.textContent = `
    @keyframes curved-scroll {
      from { stroke-dashoffset: 0; }
      to {
        stroke-dashoffset: calc(
          -1 * (var(--track-length) - ${config.thumb})
        );
      }
    }

    svg path:last-child {
      animation: curved-scroll linear both;
      animation-timeline: --curved-scroll;
    }
  `;
  wrapper.append(style);

  return {
    destroy() {
      resizeObserver?.disconnect();
      svg.remove();
      style.remove();
    },
  };
}
