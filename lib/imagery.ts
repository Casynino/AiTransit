/**
 * The picture library.
 *
 * Every id here has been checked to load. Photographs are named by what they
 * show rather than where they are used, so a card can pick the right image
 * instead of the next one in a list — a shoe market with a photograph of a
 * warehouse is worse than no photograph at all.
 *
 * Kept in one file for a practical reason: when these are eventually replaced
 * with the company's own photography — which they should be — it is one file
 * to edit, not thirty components to hunt through.
 */
const UNSPLASH = "https://images.unsplash.com/photo-";

function photo(id: string) {
  return `${UNSPLASH}${id}`;
}

export const IMAGES = {
  // Operations
  apron: photo("1515780855147-aee414989c82"),
  warehouseAisle: photo("1553413077-190dd305871c"),
  loadingTruck: photo("1601584115197-04ecc0da31d7"),
  cargoHold: photo("1587293852726-70cdb56c2866"),
  /**
   * Two plain cartons on a table. Deliberately NOT a hero image anywhere:
   * it is a photograph of packaging, and this is an air cargo company. It
   * earns its place on one card — the market that sells cartons.
   */
  packedCartons: photo("1595246140625-573b715d11dc"),
  airportNight: photo("1520437358207-323b43b50729"),
  paperwork: photo("1450101499163-c8848c66ca85"),

  // Goods and markets
  clothingRail: photo("1441986300917-64674bd600d8"),
  electronicsBench: photo("1498049794561-7780e7231661"),
  sneakers: photo("1549298916-b41d501d3772"),
  fabricRolls: photo("1558769132-cb1aea458c5e"),
  furniture: photo("1555041469-a586c61ea9bc"),
  lighting: photo("1524484485831-a92ffc0de03f"),
  autoParts: photo("1486262715619-67b85e0b08d3"),

  /* ---------------------------------------------------------------- route
     The two ends of the line. A freight company that flies one route should
     show that route, not stock photographs of anonymous skylines. */
  cargoLoading: photo("1774698078446-59299e016718"),
  apronCrew: photo("1583911026662-95161686d9a6"),
  apronVehicles: photo("1553616040-548049bba792"),
  freightTruck: photo("1508053751937-80506404c3f6"),
  jetOnStand: photo("1571086291540-b137111fa1c7"),
  loadingRamp: photo("1750783306461-9c40dd99e1ae"),

  // China
  guangzhouSkyline: photo("1583996829982-823143cc975a"),
  guangzhouAerial: photo("1521605493113-8087b77d5136"),
  pearlRiver: photo("1700045269992-7825424908a7"),

  // Zambia
  lusakaStreet: photo("1700218626406-e89c763bfbbc"),
  lusakaShopfront: photo("1684513159147-b171ece6685f"),
  lusakaTower: photo("1714484964374-ff49ac595879"),

  // Money
  countingCash: photo("1518458028785-8fbcd101ebb9"),
  banknotesFan: photo("1580048915913-4f8f5cb481c4"),

  // People at work
  warehouseTablet: photo("1781559818983-c32838ee3d55"),
  warehouseDesk: photo("1742203102929-f2810971a534"),
  boxHandover: photo("1573207535342-8c0f9506112e"),
} as const;

export type ImageKey = keyof typeof IMAGES;

/** A sized, cropped, format-negotiated URL. */
export function img(url: string, width: number, quality = 68) {
  return `${url}?auto=format&fit=crop&w=${width}&q=${quality}`;
}

/**
 * The source URL for a full-bleed banner.
 *
 * Two things this does that `img` does not, both learned the hard way.
 *
 * It pins the ASPECT. Several of these photographs are portrait — one is
 * 1800×2400 — and asking for `w=1800` alone returns the whole 800 kB of it to
 * be cropped to a letterbox afterwards. Asking for the crop up front means the
 * bytes we pay for are the bytes we show.
 *
 * And it stays SMALL. Next's image optimizer aborts an upstream fetch at seven
 * seconds; a heavy original from Unsplash regularly took longer, and the whole
 * banner then 500s and renders as flat navy — which is exactly what happened
 * to the contact page. 1600px across a 16:9 crop is plenty for a hero at any
 * width we serve, and it arrives in well under a second.
 */
export function banner(url: string, width = 1600, aspect = 16 / 9) {
  const height = Math.round(width / aspect);
  return `${url}?auto=format&fit=crop&w=${width}&h=${height}&q=62`;
}

/**
 * Which photograph belongs to which market.
 *
 * Falls back to a warehouse aisle rather than a random image: a generic but
 * plausible picture beats a picture of the wrong thing.
 */
const MARKET_IMAGES: Record<string, string> = {
  "yiwu-international-trade-city": IMAGES.warehouseAisle,
  "guangzhou-wholesale-markets": IMAGES.clothingRail,
  "shenzhen-electronics-markets": IMAGES.electronicsBench,
  "foshan-furniture-markets": IMAGES.furniture,
  "zhongda-fabric-market": IMAGES.fabricRolls,
  "keqiao-textile-market": IMAGES.fabricRolls,
  "baima-clothing-market": IMAGES.clothingRail,
  "huaqiangbei-electronics": IMAGES.electronicsBench,
  "guangzhou-shoe-markets": IMAGES.sneakers,
  "guangzhou-auto-parts": IMAGES.autoParts,
  "guzhen-lighting-market": IMAGES.lighting,
  "chenghai-toy-market": IMAGES.warehouseAisle,
  "packaging-materials-market": IMAGES.packedCartons,
};

export function marketImage(slug: string) {
  return MARKET_IMAGES[slug] ?? IMAGES.warehouseAisle;
}
