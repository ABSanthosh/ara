<script lang="ts">
	// Ref: https://github.com/ronanru/svelte-flip-clock/blob/main/src/lib/FlipClock.svelte
	// Insp: https://gridfiti.com/wp-content/uploads/2021/08/Gridfiti_Blog_BestiPadWidgets_Clock.jpg
	import { onMount } from 'svelte';
	let time = new Date();

	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'July',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];
	const date = time.getDate();
	const day = days[time.getDay()];
	const month = months[time.getMonth()];
	const year = time.getFullYear();
	// Day, Date Month Year
	const fullDate = `${day}, ${date} ${month} ${year}`;

	let display = [
		{
			top: (time.getHours() % 12 || 12).toString().padStart(2, '0'),
			bottom: (time.getHours() % 12 || 12).toString().padStart(2, '0'),
			transition: false
		},
		{
			top: time.getMinutes().toString().padStart(2, '0'),
			bottom: time.getMinutes().toString().padStart(2, '0'),
			transition: false
		},
		{
			top: time.getSeconds().toString().padStart(2, '0'),
			bottom: time.getSeconds().toString().padStart(2, '0'),
			transition: false
		}
	];

	onMount(() => {
		const interval = setInterval(() => {
			time = new Date();
			const newData: string[] = [];
			newData.push((time.getHours() % 12 || 12).toString().padStart(2, '0'));
			newData.push(time.getMinutes().toString().padStart(2, '0'));
			newData.push(time.getSeconds().toString().padStart(2, '0'));
			display = display.map(({ bottom }, i) => ({
				top: newData[i],
				bottom,
				transition: newData[i] !== bottom
			}));
			setTimeout(() => {
				display = display.map(({ top }, i) => ({
					bottom: newData[i],
					top,
					transition: false
				}));
			}, 500);
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});
</script>

<div class="FlipClock BlurBG">
	<div class="FlipClock__box">
		<div class="FlipClock__overlay">
			{#each display as segment}
				<div class="FlipClock__segment">
					<p class="FlipClock__segment--top" class:transition={segment.transition}>
						<span>
							{segment.bottom}
						</span>
					</p>
					<p class="FlipClock__segment--bottom" class:transition={segment.transition}>
						<span>
							{segment.top}
						</span>
					</p>
				</div>
			{/each}
		</div>
		<div class="FlipClock__base">
			{#each display as segment}
				<div class="FlipClock__segment">
					<p class="FlipClock__segment--top">
						{segment.top}
					</p>
					<p class="FlipClock__segment--bottom">
						{segment.bottom}
					</p>
				</div>
			{/each}
		</div>
	</div>
	<p>
		{fullDate}
	</p>
</div>

<style lang="scss">
	.FlipClock {
		@include box(315px, auto);
		gap: 15px;
		@include make-flex();
		padding: 20px;

		& > p {
			font-size: 20px;
			font-family: 'JetBrains Mono', monospace;
			color: white;
		}

		&__box {
			position: relative;
			@include box($height: auto);
			@include make-flex($dir: row);
			overflow: hidden;
		}

		&__overlay {
			position: absolute;
			@include box($height: auto);
			@include make-flex($dir: row);
			gap: 15px;

			top: 0;
			left: 0;
			z-index: 10;
			.FlipClock__segment {
				&--bottom {
					transform: scaleY(0);
				}
			}
		}

		&__base {
			@include make-flex($dir: row);
			@include box($height: auto);
			gap: 15px;
		}

		&__segment {
			@include box(100%, 100px);
			@include make-flex($dir: row);
			gap: 20px;

			color: white;
			position: relative;

			--__separator: 0.4px;

			p,
			span {
				background-color: #121212;
				border-radius: 10px;
				font-size: 60px;
				font-family: 'JetBrains Mono', monospace;
			}

			&--top,
			&--bottom {
				@include make-flex();
				@include box();
			}
			&--top {
				position: absolute;
				top: 0;
				left: 0;
				margin: 0;
				clip-path: inset(0px 0px calc(50% + var(--__separator)) 0px);
				&.transition {
					transition: transform 0.25s ease-in;
					transform: scaleY(0);
				}
			}

			&--bottom {
				clip-path: inset(calc(50% + var(--__separator)) 0px 0px 0px);
				top: 0;
				left: 0;
				position: absolute;
				margin: 0;
				&.transition {
					transition: transform 0.25s 0.25s ease-out;
					transform: scale(100%);
				}
			}
		}
	}
</style>
