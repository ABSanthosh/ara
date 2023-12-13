<script lang="ts">
  import Codemirror from "$lib/codemirror/continuelist";
  import "$lib/codemirror/codemirror.css";
  let CME: any;

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

    CME.on("change",(cm: any, change: any)=>{
      console.log(cm.getValue())
    })
  };

  $: value = `
# GitHub Flavored Markdown
# ========================
Everything from markdown plus GFM features:

## URL autolinking
Underscores_are_allowed_between_words.

## Strikethrough text
GFM adds syntax to strikethrough text, which is missing from standard Markdown.
~~Mistaken text.~~
~~**works with other formatting**~~
~~spans across 
lines~~

## Fenced code blocks (and syntax highlighting)

## Task Lists
- [ ] Incomplete task list item
- [x] Completed task list ite

## list
- List item 1
- List item 2`;

</script>

<div class="Notes BlurBG">
  <textarea use:editor bind:value />
</div>

<style lang="scss">
  .Notes {
    @include box(min(90%, 760px));
    @include make-flex();
    overflow-y: auto;
    max-height: 100%;
    border: 1px solid #999;
    // background-color: white;
  }
</style>
