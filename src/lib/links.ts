import { api, ApiError } from "./api";

export type LinkTarget =
  | { pathname: "/b/[id]"; params: { id: string } }
  | { pathname: "/fund/[id]"; params: { id: string } }
  | { pathname: "/s/[slug]"; params: { slug: string } }
  | { pathname: "/cart"; params: { resume: string } };

const CODE = /^[a-z0-9]{6,16}$/i;

/**
 * Turns whatever someone pasted (a full link, a link without https, or a bare code) into the screen
 * to open. A bare code is checked against shared lists first, then Go Solar Me pages.
 */
export async function resolveLink(raw: string): Promise<LinkTarget> {
  const t = raw.trim().replace(/[)\].,]+$/, "");
  if (!t) throw new ApiError("Paste a link or a code.", 0);
  const resume = t.match(/[?&]resume=([a-z0-9]+)/i);
  if (resume) return { pathname: "/cart", params: { resume: resume[1] } };
  const m = t.match(/\/(b|fund|s)\/([a-z0-9-]{2,40})/i);
  if (m) {
    const [, kind, id] = m;
    if (kind.toLowerCase() === "b") return { pathname: "/b/[id]", params: { id } };
    if (kind.toLowerCase() === "fund") return { pathname: "/fund/[id]", params: { id: id.toLowerCase() } };
    return { pathname: "/s/[slug]", params: { slug: id.toLowerCase() } };
  }
  if (!CODE.test(t)) throw new ApiError("That doesn't look like one of our links. It should look like solar.nexprove.com/b/ab12cd34", 0);
  const code = t.toLowerCase();
  const found = async (path: string) => api(path, { auth: false }).then(() => true, (e) => { if (e instanceof ApiError && e.status === 404) return false; throw e; });
  if (await found(`/builds/${code}`)) return { pathname: "/b/[id]", params: { id: code } };
  if (await found(`/pools/${code}`)) return { pathname: "/fund/[id]", params: { id: code } };
  throw new ApiError("No list or page uses that code. Check it and try again.", 404);
}
