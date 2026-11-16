import "i18next";
import type { defaultNS, resources } from "./index";

// Makes t("...") type-checked: a misspelled key is a compile error.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];
  }
}
