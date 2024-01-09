<script lang="ts">
  import Codemirror from "$lib/codemirror/continuelist";
  import draggable from "$actions/draggable";
  import "$lib/codemirror/codemirror.css";
  let CME: any;
  export let id: string;

  $: activeNote = 0;
  $: notes = [
    {
      id: "1",
      isActive: true,
      title: "Unitab Notes",
      modifed: "2021-10-01",
      content: `# Unitab Notes 1`,
    },
    {
      id: "2",
      isActive: false,
      title: "Unitab Notes",
      modifed: "2021-08-01",
      content: `# Unitab Notes 2`,
    },
  ];

  const editor = (node: HTMLElement) => {
    CME = Codemirror.fromTextArea(node, {
      lineNumbers: true,
      lineWrapping: true,
      mode: {
        emoji: true,
        taskLists: true,
        name: "markdown",
        strikethrough: true,
      },
      extraKeys: { Enter: "newlineAndIndentContinueMarkdownList" },
    });

    CME.on("change", (cm: any, change: any) => {
      notes = notes.map((note, index) => {
        if (index === activeNote) {
          return {
            ...note,
            content: cm.getValue(),
          };
        }
        return note;
      });
    });
  };

  $: value = `# Unitab Notes`;
  $: isPaneOpen = true;

  $: notes, console.log(notes);
</script>

<div class="Notes BlurBG" use:draggable {id}>
  <div class="Notes__header">
    <button
      on:click={() => {
        isPaneOpen = !isPaneOpen;
      }}
    >
      <svg viewBox="0 0 52 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 38.9062H45.5859C49.1738 38.9062 51.0859 36.9512 51.0859 33.3848V6.85156C51.0859 3.28516 49.1738 1.33008 45.5859 1.33008H7C3.39062 1.33008 1.47852 3.24219 1.47852 6.85156V33.3848C1.47852 36.9941 3.39062 38.9062 7 38.9062ZM7.04297 37.8535C4.07812 37.8535 2.53125 36.3066 2.53125 33.3418V6.89453C2.53125 3.9082 4.07812 2.38281 7.04297 2.38281H16.7109V37.8535H7.04297ZM45.5215 2.38281C48.3789 2.38281 50.0332 3.9082 50.0332 6.89453V33.3418C50.0332 36.3066 48.3789 37.8535 45.5215 37.8535H17.7637V2.38281H45.5215ZM12.6289 10.4395C12.9512 10.4395 13.1875 10.2031 13.1875 9.90234C13.1875 9.60156 12.9512 9.36523 12.6289 9.36523H6.61328C6.29102 9.36523 6.05469 9.60156 6.05469 9.90234C6.05469 10.2031 6.29102 10.4395 6.61328 10.4395H12.6289ZM12.6289 16.3691C12.9512 16.3691 13.1875 16.1328 13.1875 15.832C13.1875 15.5312 12.9512 15.2949 12.6289 15.2949H6.61328C6.29102 15.2949 6.05469 15.5312 6.05469 15.832C6.05469 16.1328 6.29102 16.3691 6.61328 16.3691H12.6289ZM12.6289 22.2773C12.9512 22.2773 13.1875 22.041 13.1875 21.7402C13.1875 21.4395 12.9512 21.2031 12.6289 21.2031H6.61328C6.29102 21.2031 6.05469 21.4395 6.05469 21.7402C6.05469 22.041 6.29102 22.2773 6.61328 22.2773H12.6289Z"
          fill="black"
          stroke="black"
        />
      </svg>
    </button>
    <h3>Notes</h3>
  </div>

  <div class="Notes__body">
    <ul class:open={!isPaneOpen}>
      {#each notes as note, index}
        <li>
          <button
            class:active={note.isActive}
            on:click={() => {
              CME.setValue(note.content);
              activeNote = index;
              notes = notes.map((note, index) => {
                if (index === activeNote) {
                  return {
                    ...note,
                    isActive: true,
                  };
                }
                return {
                  ...note,
                  isActive: false,
                };
              });
            }}
          >
            <h4>{note.title}</h4>
            <p>{note.modifed}</p>
          </button>
        </li>
      {/each}
    </ul>

    <textarea class:open={isPaneOpen} use:editor bind:value />
  </div>
</div>

<style lang="scss">
  .Notes {
    display: grid;
    overflow-y: auto;
    max-height: 100%;
    // border: 1px solid #999;
    @include box(760px, 500px);
    grid-template-rows: 35px 1fr;
    position: relative;

    &__header {
      gap: 10px;
      padding: 5px 10px;
      border-bottom: 1px solid #999;
      @include make-flex($dir: row, $just: flex-start);
      background: linear-gradient(180deg, #ffdd5f 0%, #fdcb00 100%);
      // background-color: #111827;

      & > button {
        border: none;
        outline: none;
        cursor: pointer;
        background: none;
        @include box(auto, 20px);
        & > svg {
          @include box();
        }
      }
    }
    
    &__body {
      @include box();
      // display: grid;
      // grid-template-columns: 240px 1fr;
      @include make-flex($dir: row);
      // &.open {
      //   grid-template-columns: 0 1fr;
      // }

      & > ul {
        bottom: 0;
        z-index: 2;
        // padding: 14px;
        list-style: none;
        // position: absolute;
        // background-color: #1c1c1e;
        flex-shrink: 0;
        // background-color: #000000;
        border-right: 1px solid #999;
        background-color: rgb(31, 41, 55);
        transition: all 0.3s ease-in-out;
        // @include box(240px, calc(100% - 35px));
        @include box(255px);
        margin-left: -255px;
        // transform: translateX(-100%);
        &.open {
          margin-left: 0;
          // transform: translateX(0);
        }

        & > li {
          @include box(100%, 55px);
          // &:first-child > button {
          //   border-radius: 7px 7px 0 0;
          // }
          // &:last-child > button {
          //   border-radius: 0 0 7px 7px;
          // }
          &:not(:last-child) {
            border-bottom: 1px solid #5a5a5a;
          }

          & > button {
            gap: 5px;
            border: none;
            outline: none;
            @include box();
            padding: 0 14px;
            cursor: pointer;
            background-color:transparent;
            @include make-flex($align: flex-start);

            &.active {
              // background-color: #313131;
              background-color: #2a2a2b;
            }

            & > h4 {
              color: #fff;
              font-size: 16px;
              font-weight: 500;
            }

            & > p {
              font-size: 12px;
              font-weight: 400;
              color: #99989d;
            }
          }
        }
      }
    }
  }
</style>
