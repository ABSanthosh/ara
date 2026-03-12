<script lang="ts">

 let temp = $state("Hello, World!");
</script>


<div class="Popup">
  <h1>{temp}</h1>
  <input type="text" bind:value={temp} />
</div>