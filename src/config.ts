export const SITE_CONFIG = {
  title: "Antony's blog",
  description: 'My Personal Projects & Opinions',
  cover: 'assets/images/blog-cover.jpg',
  logo: 'assets/images/blog-logo-with-text.png',
  logoDark: 'assets/images/blog-icon-no-text.png',
  favicon: 'assets/images/favicon.png',
  navigation: true,
  subscribers: false,
  twitter: '',
  facebook: '',
  xUsername: 'AntonyLeons',
  github: 'AntonyLeons',
  disqus: false,
  disqusShortname: 'leons-dev',
  googleAnalytics: '',
  wordsPerMinute: 200,
  pageSize: 25,
  algolia: {
    applicationId: '08WJSG8GMW',
    indexName: 'jekyll',
    searchOnlyApiKey: '899d0b22cae5a8affeb4f1f9f35adcc4',
  },
};

/**
 * Helper to resolve paths with the Astro base URL
 */
export function getAssetUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path;
  }
  const base = import.meta.env.BASE_URL; // e.g. "/casper/" or "/"
  const cleanPath = path.replace(/^\//, '');
  return `${base}${cleanPath}`;
}

/**
 * Strips HTML and markdown formatting to create a text excerpt.
 */
export function getExcerpt(content: string, limit = 33): string {
  const stripped = content
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[#*`_\[\]()\-+!]/g, '') // strip simple markdown symbols
    .replace(/\s+/g, ' ') // normalize whitespace
    .trim();
  const words = stripped.split(' ');
  if (words.length <= limit) return stripped;
  return words.slice(0, limit).join(' ') + '...';
}

/**
 * Calculates reading time based on word count.
 */
export function getReadingTime(content: string, wpm = SITE_CONFIG.wordsPerMinute): string {
  const stripped = content.replace(/<[^>]*>/g, '').trim();
  if (!stripped) return '1 min read';
  const words = stripped.split(/\s+/).length;
  if (words <= wpm) {
    return '1 min read';
  }
  return `${Math.ceil(words / wpm)} min read`;
}
