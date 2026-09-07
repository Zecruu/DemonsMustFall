import { Game } from "./game/Game";
import { configureNativeShell } from "./game/native";

const canvas = document.querySelector("#viewport");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Missing #viewport canvas");
}

void configureNativeShell();
new Game(canvas);
