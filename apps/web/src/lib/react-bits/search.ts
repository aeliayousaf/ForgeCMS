import { REACT_BITS_MANIFEST } from "./manifest";

export interface ReactBitsSearchResult {
  slug: string;
  title: string;
  description: string;
  category: string;
  supportsChildren: boolean;
}

/** Client-side search over the bundled manifest (works without the API). */
export function searchReactBitsLocal(query: string, limit = 40): ReactBitsSearchResult[] {
  const q = query.trim().toLowerCase();
  let results = Object.values(REACT_BITS_MANIFEST).map(
    ({ slug, title, description, category, supportsChildren }) => ({
      slug,
      title,
      description,
      category,
      supportsChildren,
    }),
  );

  if (q) {
    results = results.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.slug.toLowerCase().includes(q),
    );
  }

  return results.slice(0, Math.min(limit, 100));
}
