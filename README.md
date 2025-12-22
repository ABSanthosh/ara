![](./readme/Full%20screen.png)

# UniTab - Customizable Browser New Tab Extension

A beautiful and customizable new tab page browser extension built with Svelte 5, TypeScript, and WXT framework. Make your browser's new tab into a personalized dashboard with interactive widgets, dynamic wallpapers, and a clean, modern interface.

## ✨ Features

### Interactive Widgets

- **Calendar Widget** - Full calendar with timezone support and compact view
- **Analog Clock** - Traditional clock face with customizable cities and timezones
- **Flip Clock** - Digital flip-style clock with seconds display option
- **Cat Widget** - Random cat images from Reddit with source attribution

### Dynamic Wallpapers

- **NASA APOD Integration** - Daily Astronomy Picture of the Day
- **Preset Collection** - Beautiful built-in wallpapers (Adwaita, Blobs, Fold, Ventura themes)
- **Custom API Support** - Use your own NASA API key for enhanced features

### Customization Options

- **Drag & Drop** - Rearrange widgets freely on the grid
- **Resizable Widgets** - Multiple size options (1x1, 2x1, 2x2)
- **Grid System** - Organized layout with optional grid lines
- **Timezone Support** - Display time for different cities worldwide
- **Blur Effects** - Modern glassmorphism design elements

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Modern browser (Chrome/Firefox/Edge)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd unitab2
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Development**

   ```bash
   # Start development server
   npm run dev

   # For Firefox
   npm run dev:firefox

   # Watch mode with auto-reload
   npm run dev:watch
   ```

4. **Build for production**

   ```bash
   # Build extension
   npm run build

   # Build for Firefox
   npm run build:firefox

   # Create distribution zip
   npm run zip
   ```

### Loading the Extension

#### Chrome/Edge

1. Open `chrome://extensions/` or `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `.output/chrome-mv3` folder

#### Firefox

1. Open `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from `.output/firefox-mv2`

## 🛠️ Development

### Project Structure

```
src/
├── entrypoints/
│   ├── background.ts          # Extension background script
│   ├── content.ts             # Content script
│   └── newtab/               # New tab page
│       ├── App.svelte        # Main application
│       ├── index.html        # Entry point
│       └── main.ts           # Application bootstrap
├── lib/
│   ├── components/           # Reusable UI components
│   │   ├── widgets/          # Widget implementations
│   │   └── WidgetModal/      # Settings modal
│   ├── stores/               # Svelte stores for state management
│   ├── utils/                # Utility functions
│   ├── managers/             # Feature managers
│   └── actions/              # Svelte actions (drag/resize)
└── styles/                   # Global styles and themes
```

### Key Concepts

#### Widget System

Widgets are modular components that can be:

- **Dragged** around the grid
- **Resized** to different dimensions
- **Configured** through the settings modal
- **Persisted** in browser storage

#### Wallpaper Manager

Handles different wallpaper types:

- Static preset wallpapers
- Dynamic NASA APOD with daily updates
- Custom refresh functionality

#### Store Architecture

- `settingStore` - Global application settings and widget configurations
- `catStore` - Cat image caching and Reddit API management

## 🔧 Configuration

### NASA API Key

To use NASA wallpapers:

1. Get a free API key from [NASA API Portal](https://api.nasa.gov/)
2. Open settings (right-click on new tab)
3. Enter your API key in the NASA section
4. Choose between dynamic (daily) or static (specific date) modes

## 🎨 Customization

### Adding New Widgets

1. Create widget component in `src/lib/components/widgets/`
2. Add widget type to `settingStore.ts`
3. Register in main `App.svelte`
4. Add to widget creation modal

### Styling

- Global styles in `src/styles/global.scss`
- Component-specific styles use SCSS modules
- Crisp design system in `src/styles/Crisp/`

### Wallpapers

Add custom wallpapers by:

1. Placing images in `public/assets/wallpapers/`
2. Adding paths to preset array in `settingStore.ts`

## 📦 Build Configuration

The extension uses WXT for cross-browser compatibility:

- **Manifest V3** for Chrome/Edge
- **Manifest V2** for Firefox
- Automatic code splitting and optimization
- Hot reload during development

## 🐛 Known Issues

- Large cat images may take time to load
- NASA API has daily request limits
- Widget positions reset on browser storage clear

## 🔮 Future Plans

- Settings page for adding and removing Widgets
- Widgets
  - ~~Todo List~~
  - QR Code Generator: generate, copy qr etc
  - whimsical Website blocking: Something to plan what to do and not let you visit distracting websites till you finish your tasks, kinda like zen mode and pomodoro timer
  - Temp mail
  - Quote of the Day
  - Weather Widget
  - More to come!
  - Notes Widget

---

**UniTab** - Making every new tab a delightful experience! 🌟

<!-- lpUfMQ3veXufq2YSdzOkbWcs2U1Z2cQldIhQs7FJ -->
