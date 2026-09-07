import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.zecruu.demonsmustfall",
  appName: "Demons Must Fall",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
};

export default config;
