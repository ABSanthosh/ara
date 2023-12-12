<script lang="ts">
	import options from '$stores/OptionStore';

	$: tabGroups = [
		{
			title: 'Maker space',
			isOpen: false,
			links: [
				{
					favicon: 'https://www.google.com/favicon.ico',
					title: 'Google',
					url: 'https://www.google.com'
				},
				{
					favicon: 'https://www.google.com/favicon.ico',
					title: 'Google',
					url: 'https://www.google.com'
				}
			]
		}
	];

	$: isClosed = $options.sidebarIsClosed;
</script>

<aside class="Sidebar" class:closed={isClosed}>
	<button
		class="Sidebar__close"
		class:closed={!isClosed}
		data-icon={String.fromCodePoint(60099)}
		on:click={() => {
			options.set({
				...$options,
				sidebarIsClosed: !isClosed
			});
		}}
	/>
	<h2>Spaces</h2>
	{#if tabGroups.length <= 0}
		<em>No spaces yet</em>
	{:else}
		<div class="Sidebar__groups">
			{#each tabGroups as group}
				<details
					class="FancyDetails"
					open={group.isOpen}
					on:toggle={() => (group.isOpen = !group.isOpen)}
				>
					<summary>{group.title}</summary>
					<ul>
						{#each group.links as link}
							<li>
								<button
									class="FancyDetails__icon"
									data-icon={String.fromCodePoint(58829)}
									style="--favicon: url({link.favicon});"
									on:click={() => {
										group.links = group.links.filter((l) => l !== link);
										if (group.links.length === 0) {
											tabGroups = tabGroups.filter((g) => g !== group);
										}
									}}
								/>
								<a href={link.url} target="_blank" rel="noopener noreferrer">
									{link.title}
								</a>
							</li>
						{/each}
					</ul>
				</details>
			{/each}
		</div>
	{/if}
</aside>

<style lang="scss">
	.Sidebar {
		gap: 15px;
		padding: 20px;
		color: white;
		position: relative;
		@include box(315px);
		z-index: 1;
		border: 1px solid #999;
		border-radius: 17px;
		backdrop-filter: blur(16px);
		background: rgba(0, 0, 0, 0.3);
		@include make-flex($just: flex-start);
		margin-left: -315px;
		flex-shrink: 0;
		transition: margin 0.3s ease;

		&.closed {
			margin-left: 0;
		}

		& > em {
			@include box(100%, auto);
			border-radius: 9px;
			padding: 20px;
			text-align: center;
			border: 1px dashed #999;
		}

		&__close {
			top: 15px;
			right: 15px;
			border: none;
			outline: none;
			cursor: pointer;
			position: absolute;
			border-radius: 6px;
			@include make-flex();
			@include box(30px, 30px);
			transition: transform 0.3s ease;

			&::before {
				font-size: 24px;
				transition: transform 0.3s ease;
			}

			&.closed {
				transform: translateX(30px);
				&::before {
					transform: rotate(180deg);
				}
			}
		}

		& > h2 {
			font-size: 24px;
			font-weight: 600;
			@include box(100%, auto);
		}

		&__groups {
			margin-top: 20px;
			@include make-flex($just: flex-start);
			@include box(100%, auto);
			gap: 10px;
			overflow-y: auto;
		}
	}
</style>
