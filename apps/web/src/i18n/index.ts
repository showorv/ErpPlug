import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";

/**
 * Every user-facing string goes through t("..."), from day one (build plan: Bangla right after the pilot).
 * Adding Bangla later = add locales/bn.json and register it here.
 */
export const defaultNS = "translation";
export const resources = { en: { translation: en } } as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  defaultNS,
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
