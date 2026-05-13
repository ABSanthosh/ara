const VERT = `
  precision highp float;

  uniform float u_AnimationDuration;
  uniform float u_ParticleSize;
  uniform float u_ElapsedTime;
  uniform float u_ViewportWidth;
  uniform float u_ViewportHeight;
  uniform float u_TextureWidth;
  uniform float u_TextureHeight;
  uniform float u_TextureLeft;
  uniform float u_TextureTop;

  attribute float a_ParticleIndex;

  varying vec2  v_PCoord;
  varying float v_PLifetime;
  varying float v_POpacity;

  float hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123); }
  float hash3(vec2 p, float offset) {
    return fract(sin(dot(p, vec2(12.9898 + offset, 78.233 - offset))) * 43758.5453123);
  }

  vec2 toNDC(vec2 pixel) {
    return vec2(
      (pixel.x / u_ViewportWidth) * 2.0 - 1.0,
      1.0 - (pixel.y / u_ViewportHeight) * 2.0
    );
  }

  float mix1(float a, float b, float t) { return a + (b - a) * t; }

  vec2 particlePixelPos(float index) {
    float cols = max(floor(u_TextureWidth / u_ParticleSize), 1.0);
    float row = floor(index / cols);
    float col = index - row * cols;
    return vec2(
      (col + 0.5) * u_ParticleSize + u_TextureLeft,
      (row + 0.5) * u_ParticleSize + u_TextureTop
    );
  }

  mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  vec4 animatedPosition(vec2 pixelPos, float seed, float seed2, float seed3, float t) {
    vec2 base = toNDC(pixelPos);
    float rotation1 = (seed  - 0.5) * 0.52;
    float rotation2 = (seed2 - 0.5) * 0.52;
    float randomRadian = 6.28318 * (seed3 - 0.5);
    float translateX = 60.0 * cos(randomRadian) / u_ViewportWidth  * 2.0;
    float translateY = 30.0 * sin(randomRadian) / u_ViewportHeight * 2.0;
    vec2 rotated1   = rotate2D(rotation1 * t) * base;
    vec2 translated = vec2(
      mix1(rotated1.x, rotated1.x + translateX, t),
      mix1(rotated1.y, rotated1.y + translateY, t)
    );
    vec2 finalPos = rotate2D(rotation2 * t) * (translated - base) + base;
    return vec4(finalPos, 0.0, 1.0);
  }

  void main() {
    vec2 pixelPos = particlePixelPos(a_ParticleIndex);

    float seed  = hash2(pixelPos);
    float seed2 = hash3(pixelPos, 1.0);
    float seed3 = hash3(pixelPos, 2.0);

    float normalizedX    = (pixelPos.x - u_TextureLeft) / u_TextureWidth;
    float frameAssignment = (seed + 2.0 * normalizedX) / 3.0;
    float maxDelay       = u_AnimationDuration * 0.42;
    float delay          = frameAssignment * maxDelay;
    float particleDuration = u_AnimationDuration - delay;
    float lifetime       = clamp((u_ElapsedTime - delay) / particleDuration, 0.0, 1.0);
    float easedT         = 1.0 - pow(1.0 - lifetime, 3.0);

    gl_Position  = animatedPosition(pixelPos, seed, seed2, seed3, easedT);
    gl_PointSize = u_ParticleSize;

    v_PLifetime = lifetime;
    v_POpacity  = 1.0 - lifetime;

    float cols = max(floor(u_TextureWidth / u_ParticleSize), 1.0);
    float row  = floor(a_ParticleIndex / cols);
    float col  = a_ParticleIndex - row * cols;

    v_PCoord = vec2(
      (col + 0.5) / cols,
      (row + 0.5) / max(floor(u_TextureHeight / u_ParticleSize), 1.0)
    );
  }
`;

const FRAG = `
  precision mediump float;

  uniform sampler2D u_DissolveTexture;

  varying vec2  v_PCoord;
  varying float v_PLifetime;
  varying float v_POpacity;

  void main() {
    if (v_PLifetime >= 1.0) discard;

    vec4 sampled = texture2D(u_DissolveTexture, v_PCoord);
    if (sampled.a == 0.0) discard;

    float distToCenter = distance(vec2(0.5, 0.5), gl_PointCoord);
    if (distToCenter > 0.5) discard;

    float alpha = sampled.a * v_POpacity;
    gl_FragColor = vec4(sampled.rgb * 1.5, alpha);
  }
`;

const DURATION = 1600;

interface DissolvableParams {
  removed: boolean;
  onRemoved: () => void;
}

function compileShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number,
): WebGLShader | null {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "[dissolvable] Shader compile error:",
      gl.getShaderInfoLog(shader),
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vert = compileShader(gl, VERT, gl.VERTEX_SHADER);
  const frag = compileShader(gl, FRAG, gl.FRAGMENT_SHADER);
  if (!vert || !frag) return null;

  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);

  gl.detachShader(program, vert);
  gl.detachShader(program, frag);
  gl.deleteShader(vert);
  gl.deleteShader(frag);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      "[dissolvable] Program link error:",
      gl.getProgramInfoLog(program),
    );
    return null;
  }
  return program;
}

function setUniform1f(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
  value: number,
) {
  gl.uniform1f(gl.getUniformLocation(program, name), value);
}

export function dissolvable(
  node: HTMLElement,
  initialParams: DissolvableParams,
) {
  let params = initialParams;
  let triggered = false;

  // Canvas is appended to the document body so it overlays everything
  const win = node.ownerDocument.defaultView!;
  const canvas = node.ownerDocument.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:99999;";
  canvas.width = win.innerWidth;
  canvas.height = win.innerHeight;
  node.ownerDocument.body.appendChild(canvas);

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });

  let program: WebGLProgram | null = null;
  let texture: WebGLTexture | null = null;
  let buffer: WebGLBuffer | null = null;
  let particlesCount = 0;
  let animationStartTime = -1;
  let rafId: number | null = null;

  if (gl) {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    program = createProgram(gl);
  }

  function cleanup() {
    if (rafId !== null) {
      win.cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (gl) {
      if (texture) {
        gl.deleteTexture(texture);
        texture = null;
      }
      if (buffer) {
        gl.deleteBuffer(buffer);
        buffer = null;
      }
      if (program) {
        gl.deleteProgram(program);
        program = null;
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    canvas.remove();
  }

  function captureElement(rect: DOMRect): HTMLCanvasElement {
    const capture = node.ownerDocument.createElement("canvas");
    capture.width = rect.width;
    capture.height = rect.height;
    const ctx = capture.getContext("2d")!;

    // Firefox privileged context (Zen browser chrome)
    if (typeof (ctx as any).drawWindow === "function") {
      (ctx as any).drawWindow(
        win,
        rect.left + win.scrollX,
        rect.top + win.scrollY,
        rect.width,
        rect.height,
        "rgba(0,0,0,0)",
      );
      return capture;
    }

    // Standard context fallback: paint background + border-radius
    const computed = win.getComputedStyle(node);
    const bg = computed.backgroundColor;
    const radius = parseFloat(computed.borderRadius) || 0;

    ctx.beginPath();
    ctx.roundRect(0, 0, rect.width, rect.height, radius);
    ctx.closePath();
    ctx.fillStyle = bg || "#ffffff";
    ctx.fill();

    return capture;
  }

  function trigger() {
    if (triggered || !gl || !program) return;
    triggered = true;

    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      params.onRemoved();
      cleanup();
      return;
    }

    const capture = captureElement(rect);
    const ctx = capture.getContext("2d")!;

    if (texture) gl.deleteTexture(texture);
    texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const imageData = ctx.getImageData(0, 0, capture.width, capture.height);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      imageData.width,
      imageData.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      imageData.data,
    );

    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, "u_DissolveTexture"), 0);

    const particleSize = 1;
    particlesCount =
      Math.floor(rect.width / particleSize) *
      Math.floor(rect.height / particleSize);

    setUniform1f(gl, program, "u_AnimationDuration", DURATION);
    setUniform1f(gl, program, "u_ParticleSize", particleSize);
    setUniform1f(gl, program, "u_ViewportWidth", win.innerWidth);
    setUniform1f(gl, program, "u_ViewportHeight", win.innerHeight);
    setUniform1f(gl, program, "u_TextureWidth", rect.width);
    setUniform1f(gl, program, "u_TextureHeight", rect.height);
    setUniform1f(gl, program, "u_TextureLeft", rect.left);
    setUniform1f(gl, program, "u_TextureTop", rect.top);

    const indices = new Float32Array(particlesCount).map((_, i) => i);
    if (buffer) gl.deleteBuffer(buffer);
    buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const aLoc = gl.getAttribLocation(program, "a_ParticleIndex");
    gl.enableVertexAttribArray(aLoc);
    gl.vertexAttribPointer(aLoc, 1, gl.FLOAT, false, 0, 0);

    animationStartTime = -1;
    rafId = win.requestAnimationFrame(draw);
  }

  function draw(time: number = 0) {
    if (!gl || !program) return;

    if (animationStartTime === -1) animationStartTime = time;
    const elapsed = time - animationStartTime;

    if (elapsed > DURATION) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      params.onRemoved();
      cleanup();
      return;
    }

    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT);
    setUniform1f(gl, program, "u_ElapsedTime", elapsed);
    gl.drawArrays(gl.POINTS, 0, particlesCount);

    rafId = win.requestAnimationFrame(draw);
  }

  return {
    update(newParams: DissolvableParams) {
      const wasRemoved = params.removed;
      params = newParams;
      if (newParams.removed && !wasRemoved) {
        trigger();
      }
    },
    destroy() {
      cleanup();
    },
  };
}
