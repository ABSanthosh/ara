// Using Widget type somewhere where I don't want to pass id but it is mandatory in Widgets
export type Widget = {
  id?: string;
  pos: {
    row: number;
    col: number;
  };
  isDemo?: boolean;
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
    // city?: SupportedCityName;
  };
  isDemo?: boolean;
};

export type CatWidget = Widget & {
  type: "cat";
  span: CatSpan;
  settings: {
    // TODO: should I decouple these settings from widgetDefaults?
    subreddit?: string[];
    magazineSize?: number;
    maxAccess?: number; // Number of times to show the same cat before moving to next (1-10)
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

export type Widgets =
  | ClockWidgetClassicAnalog
  | ClockWidgetSemiDigital
  | ClockWidgetFlip
  | CalendarWidget
  | CatWidget
  | ChecklistWidget
  | TestWidget;
export type WidgetTypes = Widgets["type"];
