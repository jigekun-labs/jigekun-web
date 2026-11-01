import { defineRouting } from "next-intl/routing";

// Korean only for now. English was dropped with the site redesign rather than
// translated; old /en links are redirected to /ko in next.config.ts.
export const routing = defineRouting({
  locales: ["ko"],
  defaultLocale: "ko",
  localeDetection: false,
});
