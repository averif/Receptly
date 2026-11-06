import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  functions: {
    // Slug is permanent: it appears in the invocation URL.
    waitlist: {
      name: "Receptly waitlist API",
      source: "api/waitlist.ts",
    },
  },
});
