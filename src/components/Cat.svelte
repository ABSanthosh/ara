<script lang="ts">
	import { onMount } from 'svelte';
	import BlurredSpinner from './BlurredSpinner.svelte';
  import cats from '$stores/CatStore';
	import draggable from "$actions/draggable";

	$: imgSrc = { url: '', title: '', sub: '', permalink: '' };

	$: tooLong = false;
	onMount(() => {
		setTimeout(() => {
			tooLong = true;
		}, 2500);
	});

	onMount(async () => {
		imgSrc = await $cats;
	});
</script>

<div class="CatBox" style="background-image: url({imgSrc.url})" use:draggable>
	<BlurredSpinner zIndex={-2}>
		{#if tooLong}
			<h3 class="CatBox--tooLong">
				<em>Can't find a free cat, refresh the page!</em>
			</h3>
		{/if}
	</BlurredSpinner>
	{#if imgSrc.url}
		<div class="CatBox__details">
			<h4>
				<a href="https://reddit.com{imgSrc.permalink}" target="_blank">
					r/{imgSrc.sub}
				</a>
			</h4>
			<h2 title={imgSrc.title}>{imgSrc.title}</h2>
		</div>
	{/if}
</div>

<style lang="scss">
	.CatBox {
		// flex-shrink: 0;
		color: #e4e4e4;
		position: relative;
		background-size: cover;
		@include box(315px, 100%);
		max-height: 315px;
		background-position: center;
		@include make-flex($just: flex-end);
		border-radius: 20px;
		box-shadow: 0 0 20px 1px #00000087;

		&--tooLong {
			z-index: -1;
			padding: 0 20px;
			text-align: center;
		}

		&:hover {
			.CatBox__details {
				opacity: 1;
			}
		}

		&__details {
			padding: 20px;
			overflow: hidden;
			position: relative;
			@include box(100%, 130px);
			border-radius: 0 0 20px 20px;

			opacity: 0;
			transition: opacity 0.3s ease-in-out;

			&::after {
				content: '';
				position: absolute;
				left: -30px;
				z-index: -1;
				bottom: -50px;
				@include box(111%, 100%);
				background: rgba(0, 0, 0, 0.87);
				filter: blur(17.149999618530273px);
				border-radius: 0px 0px 20px 20px;
			}

			@include make-flex($align: flex-start, $just: flex-end);
			gap: 10px;
			z-index: 1;
			h4 {
				font-size: 14px;
				font-weight: 400;
				a {
					color: #c0c0c0;
					text-decoration: underline;
					&:hover {
						color: #e4e4e4;
					}
				}
			}
			h2 {
				font-size: 16px;
				font-weight: 500;
				max-width: 100%;
				overflow: hidden;
				white-space: nowrap;
				text-overflow: ellipsis;
			}
		}
	}
</style>
