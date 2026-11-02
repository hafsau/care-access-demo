"use client";

import { Analytics } from "@vercel/analytics/next";

// Page views only, and none from routes that show a health form, even a fake one.
const FORM_ROUTES = ["/", "/prescreen"];

export function SafeAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const path = new URL(event.url).pathname;
        return FORM_ROUTES.includes(path) ? null : { ...event, url: event.url.split("?")[0] };
      }}
    />
  );
}
