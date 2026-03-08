// Using Widget type somewhere where I don't want to pass id but it is mandatory in Widgets
export type Widget = {
  id?: string;
  pos: {
    row: number;
    col: number;
  };
  isDemo?: boolean;
};

// Shared magazine settings for widgets that use Magazine utility
export type MagazineSettings = {
  magazineSize?: number;
  maxAccess?: number; // Number of times to show the same item before moving to next (1-10)
  refreshInterval?: "newTab" | "24 hr" | "10 min" | "30 min"; // How often to refresh images
};

// Define valid span combinations for each widget type
export type ClockWidgetClassicAnalogSpan =
  | { x: 1; y: 1 } // Small widget
  | { x: 2; y: 2 }; // Large widget

export type ClockWidgetFlipSpan =
  | { x: 2; y: 1 } // Compact widget
  | { x: 1; y: 2 }; // Large widget

export type ClockWidgetSemiDigitalSpan =
  | { x: 1; y: 1 } // Small widget
  | { x: 2; y: 2 };

export type CalendarSpan =
  | { x: 1; y: 1 } // Compact widget
  | { x: 2; y: 2 }; // Large widget

export type CatSpan =
  | { x: 1; y: 1 } // Small cat widget
  | { x: 2; y: 2 }; // Large cat widget

export type ChecklistSpan = { x: 2; y: 2 }; // Only 2x2 size allowed

export type ArtGallerySpan =
  | { x: 2; y: 2 } // Standard widget
  | { x: 3; y: 2 }
  | { x: 3; y: 3 }
  | { x: 4; y: 3 }
  | { x: 4; y: 4 }; // Large widget

export type TestWidgetSpan =
  | { x: 1; y: 1 }
  | { x: 2; y: 2 }
  | { x: 3; y: 3 }
  | { x: 1; y: 2 }
  | { x: 2; y: 1 };

export type ClockWidgetClassicAnalog = Widget & {
  type: "analog-clock";
  span: ClockWidgetClassicAnalogSpan;
  settings: {
    city: string;
    showNumbers: boolean;
    showSecondsHand: boolean;
  };
  isDemo?: boolean;
};

export type ClockWidgetSemiDigital = Widget & {
  type: "semi-digital-clock";
  span: ClockWidgetSemiDigitalSpan;
  settings: {
    city?: string;
    is12Hour: boolean;
  };
  isDemo?: boolean;
};

export type ClockWidgetFlip = Widget & {
  type: "flip-clock";
  span: ClockWidgetFlipSpan;
  settings: {
    showSeconds: boolean;
    city?: string;
  };
  isDemo?: boolean;
};

export type CalendarWidget = Widget & {
  type: "calendar";
  span: CalendarSpan;
  settings: {
    locale?: string; // e.g., 'en', 'es', 'fr', etc.
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  };
  isDemo?: boolean;
};

export type CatWidget = Widget & {
  type: "cat";
  span: CatSpan;
  settings: MagazineSettings & {
    subreddit?: string[];
  };
  isDemo?: boolean;
};

export type ChecklistWidget = Widget & {
  type: "checklist";
  span: ChecklistSpan;
  settings: {
    items: {
      id: string;
      text: string;
      completed: boolean;
    }[];
  };
  isDemo?: boolean;
};

export type TestWidget = Widget & {
  type: "test-widget";
  span: TestWidgetSpan;
  settings: {};
  isDemo?: boolean;
};

// ========= ArtGallery Widget Types =========

export type ArtGalleryWidget = Widget & {
  type: "art-gallery";
  span: ArtGallerySpan;
  settings: MagazineSettings & {
    source: "aic" | "nga"; // Source of artworks
    favorites: string[]; // Array of favorite artwork IDs
    refreshInterval: "newTab" | "24 hr" | "10 min" | "30 min";
  };
  isDemo?: boolean;
};

export type WidgetSpans = 
  | ClockWidgetClassicAnalogSpan
  | ClockWidgetSemiDigitalSpan
  | ClockWidgetFlipSpan
  | CalendarSpan
  | CatSpan
  | ChecklistSpan
  | ArtGallerySpan
  | TestWidgetSpan;

export type Widgets =
  | ClockWidgetClassicAnalog
  | ClockWidgetSemiDigital
  | ClockWidgetFlip
  | CalendarWidget
  | CatWidget
  | ChecklistWidget
  | ArtGalleryWidget
  | TestWidget;
export type WidgetTypes = Widgets["type"];
