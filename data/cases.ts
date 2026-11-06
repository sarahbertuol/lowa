/**
 * Cases shown in "Built to convert" on Home.
 *
 * To add a case: add an object below with one of the categories, a colour for the block
 * (`tone`) and, for a live site, a 1120x700 screenshot in /public/work/ (WebP).
 * The order here is the order on the page. Tabs with no cases show a short empty note.
 */

export const categories = [
  { id: "all", label: "All" },
  { id: "invitations", label: "Invitations" },
  { id: "portfolio", label: "Portfolio" },
  { id: "institutional", label: "Institutional" },
  { id: "link-pages", label: "Link pages" },
] as const;

export type CategoryId = Exclude<(typeof categories)[number]["id"], "all">;

export type Case = {
  name: string;
  category: CategoryId;
  /** Small label on the card, e.g. the client's field. */
  tag: string;
  /** Block colour behind the screenshot: brown (default), sky, butter or sunset. */
  tone?: "brown" | "sky" | "butter" | "sunset";
  text: string;
  /** Live site. Without it the card shows the name on the coloured block. */
  site?: { url: string; host: string; img: string };
};

// Wottrich is still a placeholder (no live site yet). Card texts need the clients' OK before launch.
export const cases: Case[] = [
  {
    name: "Wottrich Advocacia",
    category: "institutional",
    tag: "Legal",
    text: "A calm, credible site that puts the practice's expertise first.",
  },
  {
    name: "Simplifique Capital",
    category: "institutional",
    tag: "Finance",
    tone: "sky",
    text: "A clear site for a financial advisor who teaches clients to run a simple, low-cost portfolio.",
    site: { url: "https://www.simplifiquecapital.com.br/", host: "simplifiquecapital.com.br", img: "/work/simplifiquecapital.webp" },
  },
  {
    name: "Fabiana Campos",
    category: "portfolio",
    tag: "Psychology",
    tone: "butter",
    text: "A warm personal site for a psychologist, with therapy and assessment explained in plain words.",
    site: { url: "https://www.fabianacampos.com.br/", host: "fabianacampos.com.br", img: "/work/fabianacampos.webp" },
  },
  {
    name: "Geraldo Búrigo",
    category: "institutional",
    tag: "Finance",
    tone: "sunset",
    text: "An editorial site for an independent investment advisor, built around a clear path to the first meeting.",
    site: { url: "https://geraldoburigo.com/", host: "geraldoburigo.com", img: "/work/geraldoburigo.webp" },
  },
  {
    name: "Bruna Fagundes",
    category: "invitations",
    tag: "Event",
    tone: "sky",
    text: "A hand-illustrated invitation site for a law graduation, with RSVP and gift list in one place.",
    site: { url: "https://www.brunafagundes.com.br/", host: "brunafagundes.com.br", img: "/work/brunafagundes.webp" },
  },
];
