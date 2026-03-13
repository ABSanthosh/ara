<script lang="ts">
  import { Square, Play } from "@lucide/svelte";
  import { fade } from "svelte/transition";

  const tracks = [
    {
      type: "track",
      name: "Rain",
      src: "https://s.ambiph.one/sounds/heavy-rain.flac",
      image: "https://content.mycutegraphics.com/graphics/rain/rain-cloud.png",
    },
    // balanced noise, bright noise, dark noise, brown noise, ocean, rain, rain stream night, fire and some binural sounds
    {
      type: "track",
      name: "Ocean",
      src: "https://s.ambiph.one/sounds/ocean.wav",
      image: "https://content.mycutegraphics.com/graphics/water/ocean-wave.png",
    },
    {
      type: "track",
      name: "Fire",
      src: "https://s.ambiph.one/sounds/fire.wav",
      image: "https://content.mycutegraphics.com/graphics/fire/fire.png",
    },
    {
      type: "track",
      name: "Bright Noise",
      src: "https://s.ambiph.one/sounds/bright-noise.wav",
      image:
        "https://content.mycutegraphics.com/graphics/noise/white-noise.png",
    },
    {
      type: "track",
      name: "Dark Noise",
      src: "https://s.ambiph.one/sounds/dark-noise.wav",
      image:
        "https://content.mycutegraphics.com/graphics/noise/black-noise.png",
    },
    {
      type: "track",
      name: "Balanced Noise",
      src: "https://s.ambiph.one/sounds/balanced-noise.wav",
      image:
        "https://content.mycutegraphics.com/graphics/noise/balanced-noise.png",
    },
    {
      type: "track",
      name: "Brown Noise",
      src: "https://s.ambiph.one/sounds/brown-noise.wav",
      image:
        "https://content.mycutegraphics.com/graphics/noise/brown-noise.png",
    },
    {
      type: "hr",
      name: "Binaural Beats",
    },
    {
      type: "track",
      name: "Delta",
      src: "https://s.ambiph.one/sounds/delta.wav",
      image: "https://content.mycutegraphics.com/graphics/binaural/delta.png",
    },
    {
      type: "track",
      name: "Theta",
      src: "https://s.ambiph.one/sounds/theta.wav",
      image: "https://content.mycutegraphics.com/graphics/binaural/theta.png",
    },
    {
      type: "track",
      name: "Alpha",
      src: "https://s.ambiph.one/sounds/alpha.wav",
      image: "https://content.mycutegraphics.com/graphics/binaural/alpha.png",
    },
    {
      type: "track",
      name: "Beta",
      src: "https://s.ambiph.one/sounds/beta.wav",
      image: "https://content.mycutegraphics.com/graphics/binaural/beta.png",
    },
  ] as const;

  type TrackItem = Extract<(typeof tracks)[number], { type: "track" }>;

  const playableTracks = tracks.filter(
    (t): t is TrackItem => t.type === "track",
  );

  let isPlaying = $state(false);
  // svelte-ignore state_referenced_locally
  let selectedTrack = $state<TrackItem | null>(playableTracks[0] ?? null);
</script>

<div class="Turntable">
  <div class="Turntable__deck">
    <div class="Turntable__disk">
      <svg
        width="130"
        height="130"
        viewBox="0 0 96 96"
        fill="none"
        style="display:block;filter:drop-shadow(rgba(0,0,0,0.15) 0px 1.625px 4.0625px) drop-shadow(rgba(0,0,0,0.12) 0px 8.125px 13px) drop-shadow(rgba(0,0,0,0.12) 0px 0px 0.40625px)"
      >
        <mask
          id="vp_mask0"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="96"
          height="96"
          style="mask-type:alpha"
        >
          <circle cx="48" cy="48" r="48" fill="black" />
          <circle cx="48" cy="48" r="48" fill="url(#vp_r0)" />
          <circle
            cx="48"
            cy="48"
            r="47.1875"
            stroke="black"
            stroke-opacity="0.8"
            stroke-width="1.625"
          />
        </mask>
        <g mask="url(#vp_mask0)">
          <circle cx="48" cy="48" r="48" fill="black" />
          <circle cx="48" cy="48" r="48" fill="url(#vp_r1)" />
          <circle
            cx="48"
            cy="48"
            r="47.1875"
            stroke="black"
            stroke-opacity="0.3"
            stroke-width="1.625"
          />
          <circle
            cx="48"
            cy="48"
            r="48.3438"
            stroke="url(#vp_l2)"
            stroke-width="0.8125"
          />
          <circle
            cx="48"
            cy="48"
            r="45.0938"
            stroke="url(#vp_l3)"
            stroke-width="0.8125"
          />
          <circle
            cx="48"
            cy="48"
            r="41.8438"
            stroke="url(#vp_l4)"
            stroke-width="0.8125"
          />
          <circle
            cx="48"
            cy="48"
            r="38.5938"
            stroke="url(#vp_l5)"
            stroke-width="0.8125"
          />
          <circle
            cx="48"
            cy="48"
            r="35.3438"
            stroke="url(#vp_l6)"
            stroke-width="0.8125"
          />
          <circle
            cx="48"
            cy="48"
            r="32.0938"
            stroke="url(#vp_l7)"
            stroke-width="0.8125"
          />
          <g filter="url(#vp_f0)">
            <path
              d="M47.6379 42.7921L50.2388 118.707L-34.6776 45.6123L47.6379 42.7921Z"
              fill="url(#vp_l8)"
            />
          </g>
          <g filter="url(#vp_f1)">
            <path
              d="M56.3805 43.3806L56.3805 -32.5788L138.744 43.3806L56.3805 43.3806Z"
              fill="url(#vp_l9)"
            />
          </g>
        </g>
        <defs>
          <filter
            id="vp_f0"
            x="-42.8026"
            y="34.6671"
            width="101.166"
            height="92.1648"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="4.0625" result="effect1_fgBlur" />
          </filter>
          <filter
            id="vp_f1"
            x="48.2555"
            y="-40.7038"
            width="98.6138"
            height="92.2094"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur stdDeviation="4.0625" result="effect1_fgBlur" />
          </filter>
          <radialGradient
            id="vp_r0"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(48 48) rotate(135) scale(65.7609 27.1741)"
          >
            <stop stop-color="white" stop-opacity="0.63" />
            <stop offset="0.66129" stop-color="white" stop-opacity="0.17" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </radialGradient>
          <radialGradient
            id="vp_r1"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(48 48) rotate(135) scale(65.7609 27.1741)"
          >
            <stop stop-color="white" stop-opacity="0.63" />
            <stop offset="0.66129" stop-color="white" stop-opacity="0.17" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </radialGradient>
          <linearGradient
            id="vp_l2"
            x1="96.7498"
            y1="96.75"
            x2="-0.750201"
            y2="-0.75003"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0.05" /><stop
              offset="0.394591"
              stop-color="white"
              stop-opacity="0.12"
            /><stop
              offset="0.498177"
              stop-color="white"
              stop-opacity="0.2"
            /><stop
              offset="0.60488"
              stop-color="white"
              stop-opacity="0.12"
            /><stop offset="1" stop-color="white" stop-opacity="0.05" />
          </linearGradient>
          <linearGradient
            id="vp_l3"
            x1="93.4998"
            y1="93.5"
            x2="2.49981"
            y2="2.49997"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0.05" /><stop
              offset="0.394591"
              stop-color="white"
              stop-opacity="0.12"
            /><stop
              offset="0.498177"
              stop-color="white"
              stop-opacity="0.2"
            /><stop
              offset="0.60488"
              stop-color="white"
              stop-opacity="0.12"
            /><stop offset="1" stop-color="white" stop-opacity="0.05" />
          </linearGradient>
          <linearGradient
            id="vp_l4"
            x1="90.2498"
            y1="90.25"
            x2="5.74982"
            y2="5.74997"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0.05" /><stop
              offset="0.394591"
              stop-color="white"
              stop-opacity="0.12"
            /><stop
              offset="0.498177"
              stop-color="white"
              stop-opacity="0.2"
            /><stop
              offset="0.60488"
              stop-color="white"
              stop-opacity="0.12"
            /><stop offset="1" stop-color="white" stop-opacity="0.05" />
          </linearGradient>
          <linearGradient
            id="vp_l5"
            x1="86.9998"
            y1="87"
            x2="8.99983"
            y2="8.99997"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0.05" /><stop
              offset="0.394591"
              stop-color="white"
              stop-opacity="0.12"
            /><stop
              offset="0.498177"
              stop-color="white"
              stop-opacity="0.2"
            /><stop
              offset="0.60488"
              stop-color="white"
              stop-opacity="0.12"
            /><stop offset="1" stop-color="white" stop-opacity="0.05" />
          </linearGradient>
          <linearGradient
            id="vp_l6"
            x1="83.7498"
            y1="83.75"
            x2="12.2498"
            y2="12.25"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0.05" /><stop
              offset="0.394591"
              stop-color="white"
              stop-opacity="0.12"
            /><stop
              offset="0.498177"
              stop-color="white"
              stop-opacity="0.2"
            /><stop
              offset="0.60488"
              stop-color="white"
              stop-opacity="0.12"
            /><stop offset="1" stop-color="white" stop-opacity="0.05" />
          </linearGradient>
          <linearGradient
            id="vp_l7"
            x1="80.4998"
            y1="80.5"
            x2="15.4998"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0.05" /><stop
              offset="0.394591"
              stop-color="white"
              stop-opacity="0.12"
            /><stop
              offset="0.498177"
              stop-color="white"
              stop-opacity="0.2"
            /><stop
              offset="0.60488"
              stop-color="white"
              stop-opacity="0.12"
            /><stop offset="1" stop-color="white" stop-opacity="0.05" />
          </linearGradient>
          <linearGradient
            id="vp_l8"
            x1="11.6492"
            y1="45.2351"
            x2="48.238"
            y2="80.972"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0" /><stop
              offset="0.452124"
              stop-color="white"
              stop-opacity="0.1"
            /><stop
              offset="0.539969"
              stop-color="white"
              stop-opacity="0.48"
            /><stop
              offset="0.635517"
              stop-color="white"
              stop-opacity="0.1"
            /><stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
          <linearGradient
            id="vp_l9"
            x1="92.4318"
            y1="42.1712"
            x2="57.088"
            y2="5.20249"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="white" stop-opacity="0" /><stop
              offset="0.452124"
              stop-color="white"
              stop-opacity="0.1"
            /><stop
              offset="0.539969"
              stop-color="white"
              stop-opacity="0.48"
            /><stop
              offset="0.635517"
              stop-color="white"
              stop-opacity="0.1"
            /><stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Album art label -->
      {#if selectedTrack && selectedTrack.type === "track"}
        <img
          class="Turntable__disk--art"
          class:isPlaying
          src={selectedTrack.image}
          alt={selectedTrack.name}
        />
      {/if}
    </div>
    <div class="Turntable__arm" class:isPlaying>
      <svg width="36" height="104" viewBox="0 0 27 80" fill="none">
        <path
          d="M18.7042 8.19556C18.7042 8.19556 18.7042 34.7407 18.7042 47.6641C18.7042 60.5876 13.9589 64.9213 13.9589 64.9213"
          stroke="black"
          stroke-opacity="0.2"
          stroke-width="5.33844"
          stroke-linecap="round"
        />
        <g filter="url(#ta_f0)">
          <path
            d="M18.7042 8.19556C18.7042 8.19556 18.7042 34.7407 18.7042 47.6641C18.7042 60.5876 13.9589 64.9213 13.9589 64.9213"
            stroke="white"
            stroke-width="4.15212"
            stroke-linecap="round"
          />
        </g>
        <g filter="url(#ta_f1)">
          <rect
            x="14"
            y="2"
            width="9.49057"
            height="11.8632"
            fill="url(#ta_lg)"
          />
          <rect
            x="14.2966"
            y="2.29658"
            width="8.89741"
            height="11.27"
            stroke="black"
            stroke-opacity="0.2"
            stroke-width="0.59316"
          />
        </g>
        <g filter="url(#ta_f2)">
          <g filter="url(#ta_f3)">
            <path
              d="M9.30333 62.425C9.93167 61.6761 11.0481 61.5785 11.7969 62.2068L16.3554 66.0318C17.1042 66.6601 17.2019 67.7766 16.5735 68.5254L10.4596 75.8116C9.8313 76.5604 8.71489 76.6581 7.96606 76.0298L7.14087 75.3374L4.23279 72.8972L3.40761 72.2048C2.65878 71.5764 2.56111 70.46 3.18945 69.7112L9.30333 62.425Z"
              fill="#E9E9E9"
            />
          </g>
          <path
            d="M16.546 65.8046L11.9876 61.9796C11.1132 61.246 9.80976 61.36 9.07614 62.2343L2.96225 69.5206C2.22863 70.3949 2.34267 71.6984 3.21697 72.432L4.04216 73.1244L6.95024 75.5646L7.77542 76.257C8.64972 76.9906 9.95321 76.8766 10.6868 76.0023L16.8007 68.716C17.5343 67.8417 17.4203 66.5382 16.546 65.8046Z"
            stroke="black"
            stroke-opacity="0.25"
            stroke-width="0.59316"
          />
        </g>
        <defs>
          <filter
            id="ta_f0"
            x="9.51017"
            y="3.74674"
            width="13.6427"
            height="65.6232"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset /><feGaussianBlur stdDeviation="1.18632" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
            />
            <feBlend in2="BackgroundImageFix" result="ds1" />
            <feBlend in="SourceGraphic" in2="ds1" result="shape" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dx="1.18632" /><feGaussianBlur stdDeviation="0.415212" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.709804 0 0 0 0 0.709804 0 0 0 0 0.709804 0 0 0 0.5 0"
            />
            <feBlend in2="shape" result="is1" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dx="-1.18632" /><feGaussianBlur stdDeviation="0.415212" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.708333 0 0 0 0 0.708333 0 0 0 0 0.708333 0 0 0 0.5 0"
            />
            <feBlend in2="is1" result="is2" />
          </filter>
          <filter
            id="ta_f1"
            x="11.3451"
            y="0.672526"
            width="14.8005"
            height="17.1732"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="1.32747" /><feGaussianBlur stdDeviation="1.32747" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
            />
            <feBlend in2="BackgroundImageFix" result="ds1" />
            <feBlend in="SourceGraphic" in2="ds1" result="shape" />
          </filter>
          <filter
            id="ta_f2"
            x="0.412163"
            y="60.3145"
            width="18.9386"
            height="19.3776"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="0.884983" /><feGaussianBlur stdDeviation="0.884983" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
            />
            <feBlend in2="BackgroundImageFix" result="ds1" />
            <feBlend in="SourceGraphic" in2="ds1" result="shape" />
          </filter>
          <filter
            id="ta_f3"
            x="1.29715"
            y="60.3145"
            width="16.8768"
            height="17.3158"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="2.37264" /><feGaussianBlur stdDeviation="0.29658" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.86 0"
            />
            <feBlend in2="shape" result="is1" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dx="1.77948" dy="1.77948" /><feGaussianBlur
              stdDeviation="0.29658"
            />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.8 0"
            />
            <feBlend in2="is1" result="is2" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dx="-0.884983" dy="-0.884983" /><feGaussianBlur
              stdDeviation="0.884983"
            />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.17 0"
            />
            <feBlend in2="is2" result="is3" />
          </filter>
          <linearGradient
            id="ta_lg"
            x1="14"
            y1="7.9316"
            x2="23.4906"
            y2="7.9316"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#CACACA" />
            <stop offset="0.253125" stop-color="#E2E2E2" />
            <stop offset="0.384375" stop-color="#F3F3F3" />
            <stop offset="0.500704" stop-color="white" />
            <stop offset="0.625" stop-color="#F3F3F3" />
            <stop offset="0.753125" stop-color="#E2E2E2" />
            <stop offset="1" stop-color="#CACACA" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="Turntable__speaker">
      <svg width="65" height="65" viewBox="0 0 45 46" fill="none">
        <circle cx="13.5002" cy="8" r="1.5" fill="url(#sp_g0)" />
        <circle cx="19.5001" cy="8" r="1.5" fill="url(#sp_g1)" />
        <circle cx="25.4994" cy="8" r="1.5" fill="url(#sp_g2)" />
        <circle cx="31.5001" cy="8" r="1.5" fill="url(#sp_g3)" />
        <circle cx="7.50049" cy="14" r="1.5" fill="url(#sp_g4)" />
        <circle cx="7.50049" cy="8" r="1.5" fill="url(#sp_g5)" />
        <circle cx="1.5" cy="14" r="1.5" fill="url(#sp_g6)" />
        <circle cx="43.4999" cy="14" r="1.5" fill="url(#sp_g7)" />
        <circle cx="13.5002" cy="14" r="1.5" fill="url(#sp_g8)" />
        <circle cx="19.5001" cy="14" r="1.5" fill="url(#sp_g9)" />
        <circle cx="25.4994" cy="14.0002" r="1.5" fill="url(#sp_g10)" />
        <circle cx="31.5001" cy="14" r="1.5" fill="url(#sp_g11)" />
        <circle cx="37.5002" cy="14" r="1.5" fill="url(#sp_g12)" />
        <circle cx="37.5002" cy="8" r="1.5" fill="url(#sp_g13)" />
        <circle cx="7.50049" cy="20" r="1.5" fill="url(#sp_g14)" />
        <circle cx="1.5" cy="20" r="1.5" fill="url(#sp_g15)" />
        <circle cx="43.4999" cy="20" r="1.5" fill="url(#sp_g16)" />
        <circle cx="13.5002" cy="20" r="1.5" fill="url(#sp_g17)" />
        <circle cx="19.5001" cy="20" r="1.5" fill="url(#sp_g18)" />
        <circle cx="25.4994" cy="20" r="1.5" fill="url(#sp_g19)" />
        <circle cx="31.5001" cy="20" r="1.5" fill="url(#sp_g20)" />
        <circle cx="37.5002" cy="20" r="1.5" fill="url(#sp_g21)" />
        <circle cx="7.50049" cy="26" r="1.5" fill="url(#sp_g22)" />
        <circle cx="1.5" cy="26" r="1.5" fill="url(#sp_g23)" />
        <circle cx="43.4999" cy="26" r="1.5" fill="url(#sp_g24)" />
        <circle cx="13.5002" cy="26" r="1.5" fill="url(#sp_g25)" />
        <circle cx="19.5001" cy="26" r="1.5" fill="url(#sp_g26)" />
        <circle cx="25.4994" cy="25.9998" r="1.5" fill="url(#sp_g27)" />
        <circle cx="31.5001" cy="26" r="1.5" fill="url(#sp_g28)" />
        <circle cx="37.5002" cy="26" r="1.5" fill="url(#sp_g29)" />
        <circle cx="7.50049" cy="32" r="1.5" fill="url(#sp_g30)" />
        <circle cx="7.50049" cy="38" r="1.5" fill="url(#sp_g31)" />
        <circle cx="1.5" cy="32" r="1.5" fill="url(#sp_g32)" />
        <circle cx="43.4999" cy="32" r="1.5" fill="url(#sp_g33)" />
        <circle cx="13.5002" cy="32" r="1.5" fill="url(#sp_g34)" />
        <circle cx="19.5001" cy="32" r="1.5" fill="url(#sp_g35)" />
        <circle cx="25.4994" cy="32" r="1.5" fill="url(#sp_g36)" />
        <circle cx="31.5001" cy="32" r="1.5" fill="url(#sp_g37)" />
        <circle cx="37.5002" cy="32" r="1.5" fill="url(#sp_g38)" />
        <circle cx="37.5002" cy="38" r="1.5" fill="url(#sp_g39)" />
        <circle cx="13.5002" cy="38" r="1.5" fill="url(#sp_g40)" />
        <circle cx="19.5001" cy="38" r="1.5" fill="url(#sp_g41)" />
        <circle cx="25.4994" cy="38" r="1.5" fill="url(#sp_g42)" />
        <circle cx="31.5001" cy="38" r="1.5" fill="url(#sp_g43)" />
        <circle cx="13.5002" cy="44" r="1.5" fill="url(#sp_g44)" />
        <circle cx="19.5001" cy="44" r="1.5" fill="url(#sp_g45)" />
        <circle cx="25.4994" cy="44" r="1.5" fill="url(#sp_g46)" />
        <circle cx="31.5001" cy="44" r="1.5" fill="url(#sp_g47)" />
        <circle cx="13.5002" cy="2" r="1.5" fill="url(#sp_g48)" />
        <circle cx="19.5001" cy="2" r="1.5" fill="url(#sp_g49)" />
        <circle cx="25.4994" cy="2" r="1.5" fill="url(#sp_g50)" />
        <circle cx="31.5001" cy="2" r="1.5" fill="url(#sp_g51)" />
        <defs>
          <!-- Each dot gets a top-dark to bottom-light gradient -->
          <linearGradient
            id="sp_g0"
            x1="13.5002"
            y1="6.5"
            x2="13.5002"
            y2="9.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g1"
            x1="19.5001"
            y1="6.5"
            x2="19.5001"
            y2="9.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g2"
            x1="25.4994"
            y1="6.5"
            x2="25.4994"
            y2="9.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g3"
            x1="31.5001"
            y1="6.5"
            x2="31.5001"
            y2="9.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g4"
            x1="7.50049"
            y1="12.5"
            x2="7.50049"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g5"
            x1="7.50049"
            y1="6.5"
            x2="7.50049"
            y2="9.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g6"
            x1="1.5"
            y1="12.5"
            x2="1.5"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g7"
            x1="43.4999"
            y1="12.5"
            x2="43.4999"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g8"
            x1="13.5002"
            y1="12.5"
            x2="13.5002"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g9"
            x1="19.5001"
            y1="12.5"
            x2="19.5001"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g10"
            x1="25.4994"
            y1="12.5002"
            x2="25.4994"
            y2="15.5002"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g11"
            x1="31.5001"
            y1="12.5"
            x2="31.5001"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g12"
            x1="37.5002"
            y1="12.5"
            x2="37.5002"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g13"
            x1="37.5002"
            y1="6.5"
            x2="37.5002"
            y2="9.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g14"
            x1="7.50049"
            y1="18.5"
            x2="7.50049"
            y2="21.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g15"
            x1="1.5"
            y1="18.5"
            x2="1.5"
            y2="21.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g16"
            x1="43.4999"
            y1="18.5"
            x2="43.4999"
            y2="21.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g17"
            x1="13.5002"
            y1="18.5"
            x2="13.5002"
            y2="21.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g18"
            x1="19.5001"
            y1="18.5"
            x2="19.5001"
            y2="21.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g19"
            x1="25.4994"
            y1="18.5"
            x2="25.4994"
            y2="21.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g20"
            x1="31.5001"
            y1="18.5"
            x2="31.5001"
            y2="21.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g21"
            x1="37.5002"
            y1="18.5"
            x2="37.5002"
            y2="21.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g22"
            x1="7.50049"
            y1="24.5"
            x2="7.50049"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g23"
            x1="1.5"
            y1="24.5"
            x2="1.5"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g24"
            x1="43.4999"
            y1="24.5"
            x2="43.4999"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g25"
            x1="13.5002"
            y1="24.5"
            x2="13.5002"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g26"
            x1="19.5001"
            y1="24.5"
            x2="19.5001"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g27"
            x1="25.4994"
            y1="24.4998"
            x2="25.4994"
            y2="27.4998"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g28"
            x1="31.5001"
            y1="24.5"
            x2="31.5001"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g29"
            x1="37.5002"
            y1="24.5"
            x2="37.5002"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g30"
            x1="7.50049"
            y1="30.5"
            x2="7.50049"
            y2="33.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g31"
            x1="7.50049"
            y1="36.5"
            x2="7.50049"
            y2="39.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g32"
            x1="1.5"
            y1="30.5"
            x2="1.5"
            y2="33.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g33"
            x1="43.4999"
            y1="30.5"
            x2="43.4999"
            y2="33.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g34"
            x1="13.5002"
            y1="30.5"
            x2="13.5002"
            y2="33.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g35"
            x1="19.5001"
            y1="30.5"
            x2="19.5001"
            y2="27.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g36"
            x1="25.4994"
            y1="30.5"
            x2="25.4994"
            y2="33.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g37"
            x1="31.5001"
            y1="30.5"
            x2="31.5001"
            y2="33.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g38"
            x1="37.5002"
            y1="30.5"
            x2="37.5002"
            y2="33.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g39"
            x1="37.5002"
            y1="36.5"
            x2="37.5002"
            y2="39.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g40"
            x1="13.5002"
            y1="36.5"
            x2="13.5002"
            y2="39.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g41"
            x1="19.5001"
            y1="36.5"
            x2="19.5001"
            y2="39.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g42"
            x1="25.4994"
            y1="36.5"
            x2="25.4994"
            y2="39.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g43"
            x1="31.5001"
            y1="36.5"
            x2="31.5001"
            y2="39.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g44"
            x1="13.5002"
            y1="42.5"
            x2="13.5002"
            y2="45.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g45"
            x1="19.5001"
            y1="42.5"
            x2="19.5001"
            y2="45.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g46"
            x1="25.4994"
            y1="42.5"
            x2="25.4994"
            y2="45.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g47"
            x1="31.5001"
            y1="42.5"
            x2="31.5001"
            y2="45.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g48"
            x1="13.5002"
            y1="0.5"
            x2="13.5002"
            y2="3.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g49"
            x1="19.5001"
            y1="0.5"
            x2="19.5001"
            y2="3.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g50"
            x1="25.4994"
            y1="0.5"
            x2="25.4994"
            y2="3.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
          <linearGradient
            id="sp_g51"
            x1="31.5001"
            y1="0.5"
            x2="31.5001"
            y2="3.5"
            gradientUnits="userSpaceOnUse"
            ><stop stop-color="#252525" /><stop
              offset="1"
              stop-color="#A4A4A4"
            /></linearGradient
          >
        </defs>
      </svg>
    </div>
  </div>
  <div class="Turntable__controls">
    <select
      class="CrispSelect"
      name="track"
      value={selectedTrack?.src}
      onchange={(event) => {
        const selectedSrc = (event.currentTarget as HTMLSelectElement).value;
        const nextTrack = playableTracks.find(
          (track) => track.src === selectedSrc,
        );

        if (nextTrack) {
          selectedTrack = nextTrack;
        }
      }}
    >
      {#each tracks as track}
        {#if track.type === "hr"}
          <hr />
        {:else}
          <option value={track.src}>{track.name}</option>
        {/if}
      {/each}
    </select>
    {#key isPlaying}
      <button
        transition:fade
        class="CrispButton"
        onclick={() => {
          isPlaying = !isPlaying;
        }}
      >
        {#if isPlaying}
          <Square size={18} />
        {:else}
          <Play size={18} />
        {/if}
      </button>
    {/key}
  </div>
</div>

<style lang="scss">
  .Turntable {
    margin: 10px;
    padding: 10px;
    border-radius: 15px;
    @include make-flex($gap: 20px);
    border: 1px solid rgba(0, 0, 0, 0.1);

    &__deck {
      position: relative;
      border-radius: 12px;
      @include box(100%, 110px);
      background-color: #f5f5f5;
      @include make-flex($dir: row);
    }

    &__disk {
      // margin: 0 auto;
      position: relative;
      @include box(130px, 130px);

      &--art {
        top: 50%;
        left: 50%;
        border-radius: 50%;
        position: absolute;
        @include box(60%, 60%);
        filter: grayscale(100%);
        transition: transform 0.3s ease;
        transform: translate(-50%, -50%);

        animation: spin 3s linear infinite;
        animation-play-state: paused;

        &.isPlaying {
          filter: grayscale(0%);
          animation-play-state: running;
        }
      }
    }

    &__speaker {
      margin: 0 auto;
      padding-left: 30px;
      @include box(65px, 65px);
    }

    &__arm {
      top: 5px;
      position: absolute;
      transform: rotate(0deg);
      @include box(36px, auto);
      transform-origin: 71% 10px;
      transition: transform 0.3s ease-in-out;

      &.isPlaying {
        transform: rotate(22deg);
      }
    }

    &__controls {
      @include box(100%, auto);
      @include make-flex($dir: row, $gap: 10px);
      & > select {
        --crp-select-bg: #fff;
        --crp-select-color: #333;
        --crp-select-padding: 6px 10px;
        --crp-select-border: 1px solid rgba(0, 0, 0, 0.1);
        --crp-select-icon: url("data:image/svg+xml;utf8,<svg fill='black' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
        --crp-select-bg-hover: rgb(228 228 228);

        & > hr {
          border: 0.2px solid rgba(0, 0, 0, 0.13);
        }

        &::picker(select) {
          --crp-select-bg: #f5f5f5;
        }

        & > option {
          &::checkmark {
            padding-left: 0px;
          }
        }
      }
      & > button {
        --crp-button-width: 32px;
        --crp-button-bg: #f5f5f5;
        --crp-button-color: #333;
        --crp-button-padding: 7px;
        --crp-button-radius: 20px;
        --crp-button-height: 32px;
        --crp-button-border: 1px solid rgba(0, 0, 0, 0.1);
      }
    }

    @keyframes spin {
      from {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      to {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }
  }
</style>
