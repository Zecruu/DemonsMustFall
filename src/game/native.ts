import { Capacitor } from "@capacitor/core";

export async function configureNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.info("[DemonsMustFall] Running in browser preview (Capacitor web).");
    return;
  }

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#07060a" });
    }
  } catch (error) {
    console.warn("[DemonsMustFall] StatusBar plugin unavailable", error);
  }

  console.info("[DemonsMustFall] Native platform:", Capacitor.getPlatform());
}

export async function impact(style: "light" | "medium" | "heavy" = "medium"): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: map[style] });
  } catch (error) {
    console.warn("[DemonsMustFall] Haptics unavailable", error);
  }
}
