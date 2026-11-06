/**
 * Cases shown in "Built to convert" on Home.
 *
 * To add a case: add an object below with one of the categories, a colour for the block
 * (`tone`) and, for a live site, a 1120x700 screenshot in /public/work/ (WebP).
 * On the page, featured cases come first; the rest are sorted by tag (A to Z), then by name. Tabs with no cases show a short empty note.
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
  /** Shown first, across the full width, in All and in its own tab. */
  featured?: boolean;
  /** Live site. Without it the card shows the name on the coloured block. */
  site?: { url: string; host: string; img: string };
};

// Card texts need the clients' OK before launch.
export const cases: Case[] = [
  {
    name: "Gampi Casa Criativa",
    category: "institutional",
    tag: "Concept",
    featured: true,
    text: "A concept we created for Gampi, an advertising and design agency: a bold, story-led site that shows the agency what its own brand could look like online.",
    site: { url: "https://gampi-site.vercel.app/", host: "gampi-site.vercel.app", img: "/work/gampi.webp" },
  },
  {
    name: "Wottrich Advocacia",
    category: "institutional",
    tag: "Legal",
    text: "A sober site for a law practice in Ivoti, with its practice areas and direct links to follow a case in court.",
    site: { url: "https://www.wottrichadvocacia.com.br/", host: "wottrichadvocacia.com.br", img: "/work/wottrichadvocacia.webp" },
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
  {
    name: "Eduardo Kayser",
    category: "institutional",
    tag: "Consulting",
    tone: "sky",
    text: "A site for a management consulting ecosystem, with separate paths for companies and for professionals.",
    site: { url: "https://www.eduardokayser.com.br/", host: "eduardokayser.com.br", img: "/work/eduardokayser.webp" },
  },
  {
    name: "Envvi",
    category: "institutional",
    tag: "Sustainability",
    tone: "butter",
    text: "A technical site for an environmental consultancy that organises a long list of climate and risk services.",
    site: { url: "https://envvi.com.br/", host: "envvi.com.br", img: "/work/envvi.webp" },
  },
  {
    name: "Fernando Kayser",
    category: "institutional",
    tag: "Insurance",
    tone: "sunset",
    text: "A warm site for a life insurance and estate planning advisor, built around protecting the family.",
    site: { url: "https://www.fernandokayser.com.br/", host: "fernandokayser.com.br", img: "/work/fernandokayser.webp" },
  },
  {
    name: "Brunch de Fraldas da Lorena",
    category: "invitations",
    tag: "Baby shower",
    tone: "butter",
    text: "An illustrated save-the-date for a baby shower held in two cities, with the details of each event.",
    site: { url: "https://convitelorena.vercel.app/", host: "convitelorena.vercel.app", img: "/work/convitelorena.webp" },
  },
  {
    name: "Geraldo Búrigo, links",
    category: "link-pages",
    tag: "Finance",
    tone: "brown",
    text: "A link page for social bios that sends followers to the consultancy, the e-book and the community.",
    site: { url: "https://geraldoburigo.com/links", host: "geraldoburigo.com/links", img: "/work/geraldoburigo-links.webp" },
  },
  {
    name: "Simplifique Capital, links",
    category: "link-pages",
    tag: "Finance",
    tone: "sky",
    text: "A link page that puts WhatsApp, the site and e-mail one tap away.",
    site: { url: "https://www.simplifiquecapital.com.br/links", host: "simplifiquecapital.com.br/links", img: "/work/simplifiquecapital-links.webp" },
  },
];
