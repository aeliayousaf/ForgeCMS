import { REACT_BITS_MANIFEST, REACT_BITS_SLUGS } from "./manifest";

export interface ReactBitsSearchResult {
  slug: string;
  title: string;
  description: string;
  category: string;
  supportsChildren: boolean;
}

export const REACT_BITS_COUNT = REACT_BITS_SLUGS.length;

/** Client-side search over the bundled manifest (works without the API). */
export function searchReactBitsLocal(query: string, limit?: number): ReactBitsSearchResult[] {
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

  results.sort((a, b) => a.title.localeCompare(b.title));

  const max = limit ?? (q ? 100 : REACT_BITS_COUNT);
  return results.slice(0, max);
}
