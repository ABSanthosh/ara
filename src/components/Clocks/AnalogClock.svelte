<script lang="ts">
	import { onMount } from 'svelte';
	import draggable from "$actions/draggable";
	let time = new Date();

	$: hours = time.getHours();
	$: minutes = time.getMinutes();
	$: seconds = time.getSeconds();

	onMount(() => {
		const interval = setInterval(() => {
			time = new Date();
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="AnalogClock BlurBG" use:draggable>
	<svg viewBox="-50 -50 100 100">
		<circle class="AnalogClock__face" r="48" />
		{#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
			<line class="AnalogClock__major" y1="39" y2="45" transform="rotate({30 * minute})" />
			<text
				x={34 * Math.sin((Math.PI / 30) * minute)}
				y={-34 * Math.cos((Math.PI / 30) * minute) + 2}
				fill="black"
				font-size="6px"
				text-anchor="middle"
			>
				{#if minute == 0}
					12
				{:else}
					{minute / 5}
				{/if}
			</text>

			{#each [1, 2, 3, 4] as offset}
				<line
					class="AnalogClock__minor"
					y1="42"
					y2="45"
					transform="rotate({6 * (minute + offset)})"
				/>
			{/each}
		{/each}

		<!-- hour hand -->
		<g class="AnalogClock__hour" transform="rotate({30 * hours + minutes / 2})">
			<line class="AnalogClock__hour--base" y1="0" y2="-8" />
			<line class="AnalogClock__hour--line" y1="-7" y2="-26" />
			<circle r="2" />
		</g>

		<!-- minute hand -->
		<g class="AnalogClock__minute" transform="rotate({6 * minutes + seconds / 10})">
			<line class="AnalogClock__minute--base" y1="0" y2="-12" />
			<line class="AnalogClock__minute--line" y1="-7" y2="-40" />
		</g>

		<!-- second hand -->
		<g class="AnalogClock__second" transform="rotate({6 * seconds})">
			<line class="AnalogClock__second--line" y1="6" y2="-44" />
			<circle r="1" />
		</g>
		<circle r="0.7" />
	</svg>
</div>

<style lang="scss">
	.AnalogClock {
		@include box(315px, 315px);
		@include make-flex();
		padding: 10px;

		& > svg {
			@include box();
			& > circle {
				fill: #fff;
			}
		}
		&__face {
			fill: white;
		}

		&__major,
		&__minor {
			stroke-linecap: round;
			stroke-linejoin: round;
		}
		&__major {
			stroke: #333;
			stroke-width: 1;
		}
		text {
			font-family: 'Lora', serif;
		}

		&__minor {
			stroke: #999;
			stroke-width: 0.5;
		}

		&__hour {
			--color: #1f1f1f;
			& > circle {
				stroke: var(--color);
			}
			&--base {
				stroke-width: 1.5;
				stroke: var(--color);
			}
			&--line {
				stroke-width: 3.5;
				stroke-linecap: round;
				stroke-linejoin: round;
				stroke: #111111;
				filter: drop-shadow(0px 0px 2px rgb(0 0 0 / 0.4));
			}
		}

		&__minute {
			--color: #1f1f1f;
			&--base {
				stroke-width: 1.5;
				stroke: var(--color);
			}
			&--line {
				stroke-width: 3.5;
				stroke-linecap: round;
				stroke-linejoin: round;
				stroke: #111111;
				filter: drop-shadow(0px 0px 2px rgb(0 0 0 / 0.4));
			}
		}

		&__second {
			&--line {
				stroke-width: 1;
				stroke-linecap: round;
				stroke-linejoin: round;
				stroke: #ff0000;
				filter: drop-shadow(0px 0px 2px rgba(0, 0, 0, 0.2));
			}

			& > circle {
				stroke: #ff0000;
				fill: #ff0000;
			}
		}
	}
</style>
