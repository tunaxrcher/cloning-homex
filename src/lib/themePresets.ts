// Theme color presets for HeroUI
// Each preset defines HSL shades for the primary color
// Format: "H S% L%" (space-separated, no hsl() wrapper)

export interface ColorPreset {
  key: string;
  label: string;
  hex: string; // display hex for the UI swatch
  shades: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  foreground: string; // text color on primary background
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    key: "blue",
    label: "Blue",
    hex: "#006FEE",
    shades: {
      50: "212 100% 97%",
      100: "212 100% 93%",
      200: "212 100% 83%",
      300: "212 100% 73%",
      400: "212 100% 60%",
      500: "212 100% 47%",
      600: "212 100% 40%",
      700: "212 100% 33%",
      800: "212 100% 25%",
      900: "212 100% 18%",
    },
    foreground: "0 0% 100%",
  },
  {
    key: "violet",
    label: "Violet",
    hex: "#7c3aed",
    shades: {
      50: "263 87% 97%",
      100: "263 87% 93%",
      200: "263 87% 83%",
      300: "263 87% 73%",
      400: "263 87% 63%",
      500: "263 70% 58%",
      600: "263 70% 48%",
      700: "263 70% 38%",
      800: "263 70% 28%",
      900: "263 70% 20%",
    },
    foreground: "0 0% 100%",
  },
  {
    key: "rose",
    label: "Rose",
    hex: "#e11d48",
    shades: {
      50: "344 100% 97%",
      100: "344 100% 93%",
      200: "344 100% 83%",
      300: "344 100% 73%",
      400: "344 100% 63%",
      500: "344 79% 50%",
      600: "344 79% 42%",
      700: "344 79% 34%",
      800: "344 79% 26%",
      900: "344 79% 18%",
    },
    foreground: "0 0% 100%",
  },
  {
    key: "orange",
    label: "Orange",
    hex: "#ea580c",
    shades: {
      50: "20 100% 97%",
      100: "20 100% 93%",
      200: "20 100% 83%",
      300: "20 100% 73%",
      400: "20 94% 63%",
      500: "20 91% 48%",
      600: "20 91% 40%",
      700: "20 91% 32%",
      800: "20 91% 24%",
      900: "20 91% 18%",
    },
    foreground: "0 0% 100%",
  },
  {
    key: "emerald",
    label: "Emerald",
    hex: "#059669",
    shades: {
      50: "160 84% 97%",
      100: "160 84% 92%",
      200: "160 84% 80%",
      300: "160 84% 65%",
      400: "160 84% 50%",
      500: "160 84% 39%",
      600: "160 84% 32%",
      700: "160 84% 25%",
      800: "160 84% 18%",
      900: "160 84% 12%",
    },
    foreground: "0 0% 100%",
  },
  {
    key: "teal",
    label: "Teal",
    hex: "#0d9488",
    shades: {
      50: "174 72% 97%",
      100: "174 72% 92%",
      200: "174 72% 78%",
      300: "174 72% 62%",
      400: "174 72% 48%",
      500: "174 72% 37%",
      600: "174 72% 30%",
      700: "174 72% 24%",
      800: "174 72% 18%",
      900: "174 72% 12%",
    },
    foreground: "0 0% 100%",
  },
  {
    key: "amber",
    label: "Amber",
    hex: "#d97706",
    shades: {
      50: "38 100% 97%",
      100: "38 100% 92%",
      200: "38 100% 80%",
      300: "38 100% 68%",
      400: "38 100% 56%",
      500: "38 92% 44%",
      600: "38 92% 36%",
      700: "38 92% 28%",
      800: "38 92% 20%",
      900: "38 92% 14%",
    },
    foreground: "0 0% 100%",
  },
  {
    key: "slate",
    label: "Slate",
    hex: "#475569",
    shades: {
      50: "215 20% 97%",
      100: "215 20% 92%",
      200: "215 20% 80%",
      300: "215 20% 68%",
      400: "215 20% 55%",
      500: "215 16% 47%",
      600: "215 19% 35%",
      700: "215 25% 27%",
      800: "215 28% 17%",
      900: "215 28% 10%",
    },
    foreground: "0 0% 100%",
  },
];

export const DEFAULT_COLOR_KEY = "blue";

export function getPresetByKey(key: string): ColorPreset | undefined {
  return COLOR_PRESETS.find((p) => p.key === key);
}
