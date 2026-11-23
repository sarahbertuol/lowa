/** Name, city, phone and link matching used to tie a source to the business. No dependencies. */

const STOP = new Set(["the", "and", "llc", "inc", "co", "company", "ltd", "corp", "of", "a", "shop", "store"]);

export const tokens = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ").split(" ").filter((t) => t && !STOP.has(t));

/** Same business name: most distinctive words in common, or one name inside the other. */
export function sameName(a: string, b: string) {
  const ta = tokens(a), tb = tokens(b);
  if (!ta.length || !tb.length) return false;
  const ja = ta.join(""), jb = tb.join("");
  if (ja === jb || (ja.length >= 4 && jb.includes(ja)) || (jb.length >= 4 && ja.includes(jb))) return true;
  const common = ta.filter((t) => tb.includes(t)).length;
  return common / Math.min(ta.length, tb.length) >= 0.67;
}

/** City part of what was typed ("Tampa, FL" → "tampa"). */
export const cityName = (city: string) => tokens(city.split(",")[0]).join(" ");

export function sameCity(captured: string, placeCity: string | null, address: string | null) {
  const c = cityName(captured);
  if (!c) return false;
  if (placeCity && tokens(placeCity).join(" ") === c) return true;
  return !!address && ` ${tokens(address).join(" ")} `.includes(` ${c} `);
}

export const digits = (p: string | null | undefined) => (p ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
export const samePhone = (a?: string | null, b?: string | null) => digits(a).length >= 10 && digits(a) === digits(b);

export const host = (url: string | null | undefined) => {
  if (!url) return "";
  try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
};
export const sameHost = (a?: string | null, b?: string | null) => !!host(a) && host(a) === host(b);

/** Instagram handle from a profile link, or null for posts, reels and other pages. */
export function instagramHandle(url: string): string | null {
  const m = url.match(/^https?:\/\/(?:www\.|m\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i);
  if (!m) return null;
  const h = m[1].toLowerCase();
  return ["p", "reel", "reels", "explore", "stories", "accounts", "tv", "about", "legal", "developer"].includes(h) ? null : h;
}

/** Facebook page from a link, or null for share, groups and other pages. */
export function facebookPage(url: string): string | null {
  const m = url.match(/^https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/([A-Za-z0-9.\-]{2,80})\/?(?:[?#].*)?$/i);
  if (!m) return null;
  const p = m[1].toLowerCase();
  return ["sharer", "share", "groups", "events", "watch", "marketplace", "login", "pages", "profile.php", "people", "tr", "dialog", "plugins", "policies", "help"].includes(p) ? null : p;
}

/** Directory and platform hosts that are never the business's own website. */
export const NOT_A_WEBSITE = [
  "instagram.com", "facebook.com", "fb.com", "tiktok.com", "x.com", "twitter.com", "linkedin.com", "youtube.com",
  "pinterest.com", "threads.net", "yelp.com", "tripadvisor.com", "yellowpages.com", "bbb.org", "mapquest.com",
  "google.com", "maps.app.goo.gl", "foursquare.com", "nextdoor.com", "angi.com", "thumbtack.com", "houzz.com",
  "manta.com", "chamberofcommerce.com", "doordash.com", "ubereats.com", "grubhub.com", "opentable.com",
  "zomato.com", "allmenus.com", "menupages.com", "restaurantguru.com", "birdeye.com", "wikipedia.org",
  "etsy.com", "amazon.com", "eventbrite.com", "groupon.com", "bizapedia.com", "dnb.com", "opencorporates.com",
];
export const isPlatform = (url: string) => {
  const h = host(url);
  return NOT_A_WEBSITE.some((p) => h === p || h.endsWith(`.${p}`));
};

/** Online store hosts that count as the business's store (not its website). */
export function storeFrom(url: string): string | null {
  const h = host(url);
  if (h === "etsy.com" && /\/shop\/[A-Za-z0-9]+/i.test(url)) return "Etsy";
  if (h.endsWith(".myshopify.com")) return "Shopify";
  if (h.endsWith(".square.site")) return "Square Online";
  if (h.endsWith(".bigcartel.com")) return "Big Cartel";
  if (h === "amazon.com" && /\/(stores|shops)\//i.test(url)) return "Amazon";
  return null;
}
