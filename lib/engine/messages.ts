/**
 * Outreach messages (OE-15). Three kinds: Personal (only after meeting in person), Instagram DM
 * (asks permission first, no link) and Email (only with a business email we can trust). The
 * proposal link is stored as {link} and filled in when shown, so a message written before
 * publishing gets the real link once there is one. Nothing is ever sent by the app.
 * No dependencies: used on the server and in the browser.
 */

export const KINDS = ["personal", "instagram_dm", "email"] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_LABEL: Record<Kind, string> = { personal: "Personal", instagram_dm: "Instagram DM", email: "Email" };

export const LINK = "{link}";
export const NO_LINK = "[proposal link: publish first]";

/** Shows the message with the proposal link (or a placeholder until it is published). */
export const fill = (body: string, url: string | null) => body.split(LINK).join(url ?? NO_LINK);
/** Back to the stored form: the link (or placeholder) becomes {link} again. */
export function unfill(text: string, url: string | null) {
  let t = text.split(NO_LINK).join(LINK);
  if (url) t = t.split(url).join(LINK);
  return t;
}

/** The DM asks first; this is the reply once they say yes. */
export const dmFollowUp = (url: string | null) =>
  `Thank you! Here it is, it takes about a minute to read:\n${url ?? NO_LINK}`;

/** Email bodies start with "Subject: ..." on the first line. */
export function splitEmail(body: string) {
  const m = body.match(/^Subject:\s*(.*)\n+([\s\S]*)$/);
  return m ? { subject: m[1].trim(), text: m[2] } : { subject: "", text: body };
}

const DASH = /[—–]/;
const HYPE = /\b(unlock|elevate|next level|game[- ]changer|supercharge|skyrocket|guarantee[ds]?)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;

/** Plain checks before copying: the same copy rules as the proposal, plus the link. */
export function messageIssues(kind: Kind, text: string, published: boolean): string[] {
  const out: string[] = [];
  if (DASH.test(text)) out.push("Long dash: use a comma, colon or parentheses.");
  if (HYPE.test(text)) out.push("Hype word or promise: keep it plain.");
  if (EMOJI.test(text)) out.push("Emoji: leave it out.");
  if (/\$\s?\d/.test(text)) out.push("No prices in the message: the proposal has them.");
  if (kind !== "instagram_dm" && !published) out.push("Publish the proposal first: the message needs its link.");
  if (kind !== "instagram_dm" && published && text.includes(NO_LINK)) out.push("The link is missing.");
  return out;
}
