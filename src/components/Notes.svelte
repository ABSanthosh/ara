<script lang="ts">
  import Codemirror from "$lib/codemirror/markdown";
  import "$lib/codemirror/codemirror.css";

  const editor = (node: HTMLElement) => {
    Codemirror.fromTextArea(node, {
      lineNumbers: true,
      lineWrapping: true,
      mode: {
        name: "markdown",
        taskLists: true,
        strikethrough: true,
        emoji: true,
      },
    });
  };
</script>

<textarea class="Notes" use:editor>
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
- [x] **Completed** task list ite
</textarea>

<!-- <div class="Notes" use:viewUse></div> -->

<style lang="scss">
  .Notes {
    @include box();
    background-color: white;
  }
</style>
