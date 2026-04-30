"use client";

import { useEffect, useState } from "react";
import { getPresetByKey, DEFAULT_COLOR_KEY, type ColorPreset } from "@/lib/themePresets";

interface ThemeColorProviderProps {
  colorKey: string;
  children: React.ReactNode;
}

function buildCssVars(preset: ColorPreset): string {
  const shadeEntries = Object.entries(preset.shades) as [string, string][];
  let css = "";
  for (const [shade, value] of shadeEntries) {
    css += `  --heroui-primary-${shade}: ${value};\n`;
  }
  css += `  --heroui-primary: ${preset.shades[500]};\n`;
  css += `  --heroui-primary-foreground: ${preset.foreground};\n`;
  return css;
}

export default function ThemeColorProvider({ colorKey, children }: ThemeColorProviderProps) {
  const [cssText, setCssText] = useState("");

  useEffect(() => {
    const preset = getPresetByKey(colorKey) || getPresetByKey(DEFAULT_COLOR_KEY);
    if (!preset || preset.key === DEFAULT_COLOR_KEY) {
      setCssText("");
      return;
    }
    const vars = buildCssVars(preset);
    setCssText(`:root, [data-theme] {\n${vars}}\n.dark {\n${vars}}`);
  }, [colorKey]);

  return (
    <>
      {cssText && <style dangerouslySetInnerHTML={{ __html: cssText }} />}
      {children}
    </>
  );
}
