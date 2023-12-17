<script lang="ts">
  import Modal from "$components/modal.svelte";
  import Switch from "$components/Switch.svelte";
  import settingStore from "$stores/SettingStore";
  export let show: boolean;

  let settings = [
    {
      name: "General",
      active: false,
      icon: String.fromCharCode(59576),
    },
    {
      name: "Appearance",
      active: true,
      icon: String.fromCharCode(58378),
    },
    {
      name: "Widgets",
      active: false,
      icon: String.fromCharCode(59505),
    },
  ];
</script>

<Modal bind:showModal={show}>
  <div class="Settings">
    <h2>
      Settings
      <button
        data-icon={String.fromCharCode(58829)}
        on:click={() => {
          show = !show;
        }}
      />
    </h2>
    <div class="Settings__content">
      <ul class="Settings__sidebar">
        {#each settings as setting}
          <li>
            <button
              class:active={setting.active}
              on:click={() => {
                settings = settings.map((s) => {
                  s.active = false;
                  return s;
                });
                setting.active = true;
              }}
              data-icon={setting.icon}
            >
              {setting.name}
            </button>
          </li>
        {/each}
      </ul>
      {#if settings[0].active}
        <div class="Settings__appearance">
          <h2>General</h2>
        </div>
      {/if}
      {#if settings[1].active}
        <ul class="Settings__appearance">
          <li>
            <h2>Background</h2>
            <div class="Settings__appearance--image"></div>
          </li>
        </ul>
      {/if}
      {#if settings[2].active}
        <ul class="Settings__widget">
          {#each Object.keys($settingStore.widgets) as widgetID}
            <li>
              <img
                src={$settingStore.widgets[widgetID].icon}
                alt={$settingStore.widgets[widgetID].name}
              />
              <div class="Settings__widget--left">
                <h2>{$settingStore.widgets[widgetID].name}</h2>
                <p>{$settingStore.widgets[widgetID].desc}</p>
              </div>
              <Switch
                id={$settingStore.widgets[widgetID].id}
                checked={$settingStore.widgets[widgetID].enabled}
                on:change={(event) => {
                  settingStore.update((store) => {
                    store.widgets[widgetID].enabled =
                      // @ts-ignore
                      event.currentTarget.checked;
                    return store;
                  });
                }}
              />
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</Modal>

<style lang="scss">
  .Settings {
    @include box();
    overflow: hidden;
    border-radius: inherit;
    backdrop-filter: blur(15px);
    background-color: #fafafaf7;
    box-shadow: 0 0 20px 1px #0000003b;
    @include make-flex($just: flex-start);

    & > h2 {
      font-size: 30px;
      color: #3d3d3d;
      padding: 14px 20px;
      @include box(100%, 60px);
      border-bottom: 1.5px solid #d3d3d3;
      @include make-flex($dir: row, $just: space-between);

      & > button {
        border: none;
        outline: none;
        cursor: pointer;
        border-radius: 50%;
        @include make-flex();
        @include box(25px, 25px);
        transition: all 0.3s ease;
        background-color: #e3e3e3;
        &:hover {
          background-color: #ec6e6e;

          &::before {
            color: #fff;
          }
        }

        &::before {
          font-size: 18px;
          color: #727272;
        }
      }
    }

    &__content {
      min-width: 0;
      min-height: 0;
      display: grid;
      @include box();
      grid-template-columns: 240px 1fr;
    }

    &__sidebar {
      padding: 16px;
      border-right: 1.5px solid #d3d3d3;
      overflow-y: auto;
      list-style: none;
      @include make-flex($just: flex-start);
      flex-wrap: wrap;
      gap: 5px;

      & > li {
        @include box(100%, 45px);

        & > button {
          @include box();
          @include make-flex($dir: row, $just: flex-start);
          gap: 10px;
          padding: 0 15px;
          border-radius: 12px;
          cursor: pointer;
          border: none;
          font-size: large;
          color: #717171;
          outline: none;
          transition: all 0.3s ease;
          background-color: transparent;

          &::before {
            color: #717171;
          }
          &.active {
            background-color: #338cec;
            color: #ffffff;

            &::before {
              color: #ffffff;
            }
          }
          &:not(.active) {
            &:hover {
              background-color: #e3e3e3;
              color: #3d3d3d;
            }
          }
        }
      }
    }

    &__widget {
      padding: 20px;
      @include box();
      overflow-y: auto;
      list-style: none;
      @include make-flex($just: flex-start);

      &--left {
        flex: 1;
        gap: 7px;
        @include make-flex($align: flex-start);

        & > p {
          color: #717171;
          font-size: 15px;
        }
      }

      & > li {
        gap: 15px;
        padding: 10px 0;
        min-height: 65px;
        @include box(100%, auto);
        @include make-flex($dir: row, $just: space-between, $align: flex-start);

        & > img {
          object-fit: cover;
          border-radius: 8px;
          object-position: center;
          @include box(50px, 50px);
          box-shadow: 0px 0px 5px 0px rgba(0, 0, 0, 0.15);
        }

        &:first-child {
          border-radius: 12px 12px 0 0;
        }

        &:last-child {
          border-radius: 0 0 12px 12px;
        }

        &:not(:last-child) {
          border-bottom: 1.5px solid #d3d3d3;
        }
      }
    }

    &__appearance {
      border-bottom-right-radius: inherit;
      @include box();
      overflow-y: auto;
      list-style: none;
      padding: 40px 20px 20px 20px;

      & > li {
        @include box(100%, auto);
      }
    }
  }
</style>
