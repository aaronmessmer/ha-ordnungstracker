import { de } from "../locales/de";
import { en } from "../locales/en";

export type Key = keyof typeof de;
const dictionaries: Record<string, Record<string, string>> = { de, en };

/** Deutsch ist die Hauptsprache; jede deutsche Sprachvariante nimmt Deutsch, alles andere Englisch. */
export function pickLanguage(haLanguage: string | undefined): "de" | "en" {
  return (haLanguage ?? "de").toLowerCase().startsWith("de") ? "de" : "en";
}

export function makeT(haLanguage: string | undefined) {
  const dict = dictionaries[pickLanguage(haLanguage)];
  return (key: Key, params?: Record<string, string | number>): string => {
    let text = dict[key] ?? de[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  };
}

export type T = ReturnType<typeof makeT>;
