<script lang="ts">
  import { SettingStore } from "@/lib/modules/settings/settings.store";
  import type { TSettingStore } from "@/lib/modules/settings/settings.types";
  import { WallpaperManager } from "@/lib/modules/wallpaper/wallpaper.manager";
  import { Dices } from "@lucide/svelte";
  import { get } from "svelte/store";
  import NasaLogo from "~/assets/nasa.png";

  let oldAPIKey = WallpaperManager.NASAEngine.apiKey || "";
  let nasaAPIKey = $state(oldAPIKey || "");

  function handleAPIKeyChange() {
    if (nasaAPIKey.trim() === "DEMO_KEY" || nasaAPIKey.trim() === "") return;

    WallpaperManager.NASAEngine.validateAPIKey(nasaAPIKey).then((isValid) => {
      if (isValid) {
        WallpaperManager.NASAEngine.saveAPIKey(nasaAPIKey);
        alert("NASA API Key is valid and has been set!");
      } else {
        alert("Invalid NASA API Key. Please try again.");
      }
    });
  }

  // Radio group for selecting Static vs Dynamic
  let oldWallpaper = WallpaperManager.getWallpaper()?.metadata;
  let wallpaperType: "Static" | "Dynamic" | undefined = $state(
    oldWallpaper?.mode === "static" ? "Static" : "Dynamic",
  );

  let localReactiveSettings = $state<TSettingStore>();
  SettingStore.subscribe((settings) => {
    localReactiveSettings = settings;
    if (settings.wallpaper.activePlugin === "preset") {
      wallpaperType = undefined;
    }
  });
</script>

<div class="Appearance">
  <div class="Appearance__header">
    <h2>Background</h2>
  </div>
  <section class="Appearance__dynamic">
    <h3 class="Appearance__subheader">Dynamic Wallpapers</h3>
    <div class="Nasa blur-thin">
      <div class="Nasa__header">
        <img src={NasaLogo} alt="NASA Logo" />
        <div class="Nasa__header--right">
          <h4>NASA Wallpapers</h4>
          <div class="Nasa__header--right__input-group">
            <label for="nasa-api-key">
              <input
                type="text"
                id="nasa-api-key"
                class="CrispInput"
                bind:value={nasaAPIKey}
                autocomplete="off"
                spellcheck="false"
                tabindex="-1"
                placeholder="Enter your NASA API Key"
                onkeydown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAPIKeyChange();
                  }
                }}
              />
            </label>
            <button
              class="CrispButton"
              data-type="primary"
              disabled={oldAPIKey === nasaAPIKey}
              onclick={async () => handleAPIKeyChange()}
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
      <div class="Nasa__options">
        <label>
          <input
            class="CrispInput"
            type="radio"
            name="wallpaper-type"
            value="Static"
            onclick={() => {
              // if static is selected,
              // if staticDate exists in oldWallpaper, use that date
              // else don't do anything, when user selects date, it will be set
              if (localReactiveSettings?.wallpaper.plugins.nasa.staticDate) {
                WallpaperManager.setWallpaper({
                  type: "nasa",
                  options: {
                    mode: "static",
                    category: "apod",
                    date: new Date(
                      localReactiveSettings?.wallpaper.plugins.nasa.staticDate,
                    ),
                  },
                });
              }
            }}
            bind:group={wallpaperType}
          />
          <p>Static Wallpapers</p>
          <input
            type="date"
            class="CrispInput"
            name="static-date"
            disabled={wallpaperType !== "Static"}
            onchange={(e) => {
              const date = (e.target as HTMLInputElement).value;
              WallpaperManager.setWallpaper({
                type: "nasa",
                options: {
                  mode: "static",
                  category: "apod",
                  date: new Date(date),
                },
              });
            }}
            value={oldWallpaper &&
            oldWallpaper.mode === "static" &&
            oldWallpaper.staticDate
              ? new Date(oldWallpaper.staticDate).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0]}
            min="1995-06-16"
            max={new Date().toISOString().split("T")[0]}
          />
          <!-- TODO: When I roll the dice the date picker isn't showing the new date -->
          <button
            class="CrispButton"
            onclick={() => WallpaperManager.refreshNASA()}
            title="Random NASA Wallpaper"
          >
            <Dices />
          </button>
        </label>
        <label>
          <input
            class="CrispInput"
            type="radio"
            name="wallpaper-type"
            value="Dynamic"
            onclick={() => {
              WallpaperManager.setWallpaper({
                type: "nasa",
                options: {
                  mode: "dynamic",
                  category: "apod",
                },
              });
            }}
            bind:group={wallpaperType}
          />
          <p>Dynamic Wallpapers</p>
        </label>
      </div>
      <p class="Nasa__apiHelp">
        Don't have a NASA API key? <a
          href="https://api.nasa.gov/"
          target="_blank">Get one free here</a
        >
      </p>
    </div>

    <!-- Add your appearance settings UI here -->
  </section>

  <section class="Appearance__preset">
    <h3 class="Appearance__subheader">Preset Wallpapers</h3>
    <div class="Appearance__preset--options">
      {#each get(SettingStore).wallpaper.plugins.presets as preset}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <img
          class:active={localReactiveSettings?.wallpaper.activePlugin ===
            "preset" && localReactiveSettings?.wallpaper.url === preset}
          src={preset}
          onclick={() => {
            WallpaperManager.setWallpaper({
              type: "preset",
              options: {
                url: preset,
              },
            });
          }}
          alt="Preset Wallpaper"
          loading="lazy"
          style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;"
        />
      {/each}
    </div>
  </section>
</div>

<style lang="scss">
  .Appearance {
    width: 100%;
    overflow-y: auto;
    padding: 31px 25px 25px 25px;

    @include make-flex($just: flex-start);

    &__header {
      width: 100%;
      @include make-flex($dir: row, $align: center, $just: space-between);
      & > h2 {
        font-size: 26px;
        color: var(--vibrant-labels-primary);
        font-weight: 600;
      }
    }

    &__subheader {
      width: 100%;

      font-size: 23px;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--vibrant-labels-primary);
    }

    &__dynamic {
      margin-top: 15px;
      @include box(100%, auto);
    }

    &__preset {
      margin-top: 25px;
      @include box($height: auto, $width: 100%);
      @include make-flex(
        $dir: column,
        $align: flex-start,
        $just: flex-start,
        $gap: 15px
      );

      &--options {
        gap: 15px;
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));

        & > img {
          @include box($height: 150px);
          border-radius: 8px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
          border: none;
          &:hover {
            transform: scale(1.02);
          }
          &.active {
            border: 4px solid #338cec;
          }
        }
      }
    }
  }

  .Nasa {
    width: 100%;
    padding: 10px;
    border-radius: 20px;
    border: 1px solid var(--separator-secondary);

    @supports (corner-shape: squircle) {
      border-radius: 40px;
      corner-shape: squircle;
    }
    @include box($height: auto, $width: 100%);
    @include make-flex($dir: column, $align: flex-start, $just: flex-start);

    &__header {
      width: 100%;
      @include make-flex(
        $dir: row,
        $align: center,
        $just: flex-start,
        $gap: 15px
      );

      & > img {
        margin-left: 8px;
        @include box(60px, 60px);
      }

      &--right {
        width: 100%;
        @include make-flex(
          $dir: column,
          $align: flex-start,
          $just: center,
          $gap: 10px
        );

        & > h4 {
          font-size: 20px;
          font-weight: 600;
          color: var(--vibrant-labels-primary);
        }

        &__input-group {
          width: 100%;
          @include make-flex(
            $dir: row,
            $align: center,
            $just: flex-start,
            $gap: 10px
          );

          & > label {
            width: 100%;
            @include make-flex(
              $gap: 4px,
              $dir: row,
              $align: flex-start,
              $just: flex-start
            );

            & > input {
              width: 100%;
            }
          }
        }
      }
    }

    &__options {
      width: 100%;
      margin-top: 20px;
      @include make-flex($dir: column, $align: flex-start, $just: flex-start);

      & > label {
        border: none;
        outline: none;
        cursor: pointer;
        font-size: large;
        position: relative;
        border-radius: 12px;
        padding: 0 8px 0 15px;
        @include box(100%, 48px);
        color: var(--vibrant-labels-primary);
        background-color: transparent;
        transition: all 0.1s ease-in-out;
        @include make-flex($dir: row, $just: flex-start, $gap: 10px);

        @supports (corner-shape: squircle) {
          border-radius: 30px;
          corner-shape: squircle;
        }

        & > input[type="date"] {
          margin-left: auto;
          --crp-input-width: auto;
        }

        & > button.CrispButton {
          --crp-button-radius: 10px;
          --crp-button-width: 32px;
          --crp-button-padding-x: 6px;
        }

        &:has(input:checked) {
          background: var(--labels-secondary);
          // background-color: #338cec;
          color: #fff;

          svg {
            color: #fff;
          }
        }
      }
    }

    &__apiHelp {
      margin-top: 5px;
      font-size: 14px;
      padding-left: 7px;
      padding-bottom: 2px;
      color: var(--vibrant-labels-primary);

      a {
        font-weight: 500;
        text-decoration: underline;
        color: var(--colors-cyan);
      }
    }
  }
</style>
