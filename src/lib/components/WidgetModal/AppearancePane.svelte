<script lang="ts">
  import { setDynamicWallpaper } from "@/lib/managers/wallpaperManager";
  import settingStore from "../../stores/setting.store";
  import { fetchTodaysAPOD } from "../../utils/NasaWallpaper";
  import NasaLogo from "~/assets/nasa.png";

  let apiKeyState = $state<"empty" | "valid" | "invalid">(
    $settingStore.wallpapers.nasaAPIKey &&
      $settingStore.wallpapers.nasaAPIKey !== "DEMO_KEY"
      ? "valid"
      : "empty"
  );
  let apodError = $state("");
  let apiKeyInput = $state($settingStore.wallpapers.nasaAPIKey || "");
  let staticDate = $state(
    $settingStore.options.wallpaper.metadata.mode === "static"
      ? $settingStore.options.wallpaper.metadata.lastUpdate
      : new Date().toISOString().split("T")[0]
  );
</script>

<div class="Appearance">
  <h2 class="Appearance__header">Background</h2>

  <section class="Appearance__dynamic">
    <h3 class="Appearance__subheader">Dynamic Wallpapers</h3>
    <div class="Nasa">
      <div class="Nasa__header">
        <img src={NasaLogo} alt="NASA Logo" />
        <div class="Nasa__header--right">
          <h4>NASA Wallpapers</h4>
          <label for="nasa-api-key">
            <input
              id="nasa-api-key"
              class="CrispInput"
              type="text"
              placeholder="Enter your NASA API key"
              bind:value={apiKeyInput}
            />
            <button
              class="CrispButton"
              onclick={async () => {
                try {
                  const validityTestResult = await fetchTodaysAPOD(apiKeyInput);
                  if (validityTestResult.media_type === "image") {
                    apiKeyState = "valid";
                    apodError = "";
                    // Save to settings
                    settingStore.update((store) => {
                      store.wallpapers.nasaAPIKey = apiKeyInput.trim();
                      return store;
                    });
                  } else {
                    apiKeyState = "invalid";
                    apodError =
                      "The API key is invalid or has no image access.";
                  }
                } catch (error) {
                  apiKeyState = "invalid";
                  apodError =
                    "The API key is invalid or there was a network error.";
                }
              }}
              disabled={!apiKeyInput.trim() || apiKeyState === "valid"}
            >
              {apiKeyState === "valid" ? "Valid API Key" : "Check"}
            </button>
          </label>

          {#if apodError}
            <i class="CrispMessage" data-type="error" data-format="box">
              {apodError}
            </i>
          {/if}
        </div>
      </div>

      <div class="Nasa__items">
        <div class="Nasa__item">
          <input
            type="radio"
            id="nasa-dynamic"
            name="nasa-wallpaper-type"
            value="dynamic"
            checked={$settingStore.options.wallpaper.type === "nasa" &&
              $settingStore.options.wallpaper.metadata.mode === "dynamic"}
            onchange={() => setDynamicWallpaper("dynamic")}
          />
          <label for="nasa-dynamic">Dynamic (Daily Update)</label>
        </div>

        <div class="Nasa__item" style="padding: 7px 7px 7px 18px;">
          <input
            type="radio"
            id="nasa-static"
            name="nasa-wallpaper-type"
            value="static"
            checked={$settingStore.options.wallpaper.type === "nasa" &&
              $settingStore.options.wallpaper.metadata.mode === "static"}
            onchange={() => setDynamicWallpaper("static", staticDate)}
          />

          <label for="nasa-static">
            Static
            <input
              type="date"
              id="nasa-static-date"
              name="nasa-static-date"
              bind:value={staticDate}
              min="2020-01-01"
              max={new Date().toISOString().split("T")[0]}
              disabled={!($settingStore.options.wallpaper.type === "nasa" &&
                $settingStore.options.wallpaper.metadata.mode === "static")}
              onchange={() => setDynamicWallpaper("static", staticDate)}
            />
          </label>
        </div>

        <p class="Nasa__apiHelp">
          Don't have a NASA API key? <a
            href="https://api.nasa.gov/"
            target="_blank">Get one free here</a
          >
        </p>
      </div>
    </div>
  </section>

  <section class="Appearance__preset">
    <h3 class="Appearance__subheader">Preset Wallpapers</h3>
    <div class="Appearance__preset--content">
      {#each $settingStore.wallpapers.presets as src}
        <button
          aria-label="Select wallpaper"
          class="Appearance__preview"
          class:active={$settingStore.options.wallpaper.url === src}
          style={`background-image: url(${src})`}
          onclick={() => {
            settingStore.update((store) => {
              store.options.wallpaper = {
                type: "preset",
                url: src,
                metadata: {},
              };
              return store;
            });
          }}
        ></button>
      {/each}
    </div>
  </section>
</div>

<style lang="scss">
  @use "../../../styles/mixins.scss" as *;
  .Appearance {
    gap: 20px;
    @include box($height: auto);
    @include make-flex($dir: column, $align: flex-start, $just: flex-start);
    &__header {
      font-size: 24px;
      color: #f4f4f4;
      font-weight: 500;
    }

    &__subheader {
      font-size: 20px;
      color: #f4f4f4;
      font-weight: 500;
      @include box($height: auto);
    }

    &__content {
      gap: 25px;
      display: grid;
      padding: 10px 0;
      font-size: 18px;
      color: #c6c5c2;
      margin-top: 10px;
      @include box($height: auto);
      grid-template-columns: 1fr 1fr;
    }

    &__preview {
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
        box-shadow: 0 0 0 4px #338cec inset;
      }
    }

    &__preset {
      gap: 15px;
      @include box($height: auto, $width: 100%);
      @include make-flex($dir: column, $align: flex-start, $just: flex-start);

      &--content {
        gap: 15px;
        width: 100%;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
    }

    &__dynamic {
      @include box($height: auto, $width: 100%);
      @include make-flex($dir: column, $align: flex-start, $just: flex-start);
      gap: 15px;
    }
  }

  .Nasa {
    gap: 10px;
    width: 100%;
    padding: 13px;
    color: #202020;
    border-radius: 8px;
    background-color: #f4f4f4;
    @include box($height: auto, $width: 100%);
    @include make-flex($dir: column, $align: flex-start, $just: flex-start);

    &__header {
      gap: 10px;
      @include box($height: auto, $width: 100%);
      @include make-flex($dir: row, $align: flex-start, $just: flex-start);

      img {
        width: 60px;
        height: 60px;
      }

      &--right {
        gap: 7px;
        width: 100%;
        @include make-flex($dir: column, $align: flex-start, $just: flex-start);

        h4 {
          font-size: 20px;
          color: #202020;
        }

        .error {
          color: #dc2626;
          font-size: 14px;
          margin-top: 4px;
        }

        .info {
          color: #6b7280;
          font-size: 14px;
          margin-top: 8px;
        }

        label {
          gap: 4px;
          width: 100%;
          color: #202020;
          @include make-flex($dir: row, $align: flex-start, $just: flex-start);

          & > p {
            font-size: 16px;
          }
        }
      }
    }
    &__apiHelp {
      font-size: 14px;
      color: #404040;

      a {
        color: #338cec;
        font-weight: 500;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    &__items {
      gap: 12px;
      width: 100%;
      margin-top: 8px;
      @include make-flex($dir: column, $align: flex-start, $just: flex-start);
    }

    &__item {
      gap: 12px;
      width: 100%;
      padding: 13px 18px;
      border-radius: 10px;
      background-color: #fafafa;
      border: 2px solid #e5e5e5;
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
      @include make-flex($dir: row, $align: center, $just: flex-start);

      &:hover {
        background-color: #f0f8ff;
        border-color: #338cec;
        box-shadow: 0 2px 8px rgba(51, 140, 236, 0.1);
      }

      &:has(input:checked) {
        background-color: #e6f3ff;
        border-color: #338cec;
        box-shadow: 0 2px 12px rgba(51, 140, 236, 0.15);
      }

      input[type="radio"] {
        width: 20px;
        height: 20px;
        margin: 0;
        cursor: pointer;
        accent-color: #338cec;
        flex-shrink: 0;
      }

      label {
        flex: 1;
        cursor: pointer;
        font-size: 16px;
        font-weight: 500;
        color: #2a2a2a;
        margin: 0;
        @include make-flex($dir: row, $align: center, $just: space-between);

        input[type="date"] {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background-color: white;
          color: #374151;
          cursor: pointer;
          transition: border-color 0.2s ease;
          margin-left: 12px;

          &:focus {
            outline: none;
            border-color: #338cec;
            box-shadow: 0 0 0 3px rgba(51, 140, 236, 0.1);
          }

          &:hover:not(:disabled) {
            border-color: #9ca3af;
          }

          &:disabled {
            background-color: #f3f4f6;
            color: #9ca3af;
            cursor: not-allowed;
            border-color: #e5e7eb;
          }
        }
      }
    }
  }
</style>
