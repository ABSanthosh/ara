<script lang="ts">
  import Codemirror from "$lib/codemirror/continuelist";
  import draggable from "$actions/draggable";
  import "$lib/codemirror/codemirror.css";
  let CME: any;
  export let id: string;

  const editor = (node: HTMLElement) => {
    CME = Codemirror.fromTextArea(node, {
      lineNumbers: true,
      lineWrapping: true,
      mode: {
        name: "markdown",
        taskLists: true,
        strikethrough: true,
        emoji: true,
      },
      extraKeys: { Enter: "newlineAndIndentContinueMarkdownList" },
    });

    CME.on("change", (cm: any, change: any) => {
      console.log(cm.getValue());
    });
  };

  $: value = `# Unitab Notes`;
</script>

<div class="Notes BlurBG" use:draggable {id}>
  <textarea use:editor bind:value />
</div>

<style lang="scss">
  .Notes {
    @include box(min(90%, 760px), 500px);
    @include make-flex($just: flex-start);
    overflow-y: auto;
    max-height: 100%;
    border: 1px solid #999;
    // background-color: white;
  }
</style>
