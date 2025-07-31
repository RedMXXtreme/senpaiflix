export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/'/g, '') // Remove apostrophes
    .replace(/:/g, '') // Remove colons
    .replace(/[\s\W-]+/g, '-') // Replace spaces and other non-word chars with hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

export function deslugify(slug) {
  return slug
    .toString()
    .toLowerCase()
    .replace(/-/g, ' ');
}
