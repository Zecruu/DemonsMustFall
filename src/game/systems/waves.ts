import { CAMPAIGN_WAVES } from "../data/constants";
import { demonHp, demonSpeed, spawnInterval, waveDemonCount } from "./scaling";

export type WaveSpec = {
  wave: number;
  name: string;
  count: number;
  hp: number;
  speed: number;
  interval: number;
  final: boolean;
};

export function makeWave(wave: number, endless: boolean): WaveSpec {
  const final = !endless && wave >= CAMPAIGN_WAVES;
  return {
    wave,
    name: final ? "The Falling Host" : `Wave ${wave}`,
    count: waveDemonCount(wave, endless),
    hp: demonHp(wave) * (final ? 1.35 : 1),
    speed: demonSpeed(wave),
    interval: spawnInterval(wave),
    final,
  };
}

export function campaignComplete(wave: number, endless: boolean): boolean {
  return !endless && wave > CAMPAIGN_WAVES;
}
