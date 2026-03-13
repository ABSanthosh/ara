export type TTrack = {
  noise: { [key: string]: TTrackItem };
  binaural: { [key: string]: TTrackItem };
};

export type TTrackItem = {
  name: string;
  src: string;
  image: string;
  type: "noise" | "binaural";
};

export type TPopupStore = {
  internal: {
    isOpen: boolean;
  };
  apps: {
    turntable: {
      isPlaying: boolean;
      currentTrack: TTrackItem | null;
    };
  };
};
