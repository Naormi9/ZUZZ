/** Generate URL-friendly slug from Hebrew or English text */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\u0590-\u05FF-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Generate a listing slug for SEO */
export function listingSlug(title: string, id: string): string {
  const slug = slugify(title);
  const shortId = id.slice(0, 8);
  return slug ? `${slug}-${shortId}` : shortId;
}
