export type IapProduct = {
  id: string;
  title: string;
  blurb: string;
  gems: number;
  unlockHero?: string;
};

export const IAP_PRODUCTS: IapProduct[] = [
  {
    id: "gems_80",
    title: "80 Bloodstones",
    blurb: "Unlock a hero or skip the grind later.",
    gems: 80,
  },
  {
    id: "gems_500",
    title: "500 Bloodstones",
    blurb: "Starter pack placeholder for StoreKit.",
    gems: 500,
  },
  {
    id: "hero_seraph",
    title: "Unlock Seraph",
    blurb: "Warden hero — slows the lane so towers can finish the horde.",
    gems: 0,
    unlockHero: "seraph",
  },
];
