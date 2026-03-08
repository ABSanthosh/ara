<script lang="ts">
  let tmp = $state("");
</script>

<div class="popup-container">
  <h1>Popup</h1>
  <p>This is the popup content.</p>
  <input type="text" bind:value={tmp} placeholder="Type something..." />
  <p>You typed: {tmp}</p>
</div>
