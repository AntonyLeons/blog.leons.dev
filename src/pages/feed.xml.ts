import { getCollection } from 'astro:content';
import { SITE_CONFIG, getAssetUrl } from '../config';
import authors from '../data/authors.json';

export async function GET(context: any) {
  const posts = await getCollection('posts');
  posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  
  const siteUrl = context.site || 'https://jekyllt.github.io/jasper2/';
  const feedUrl = new URL(getAssetUrl('/feed.xml'), siteUrl).toString();
  const indexUrl = new URL(getAssetUrl('/'), siteUrl).toString();
  const lastUpdated = posts.length > 0 ? new Date(posts[0].data.date).toISOString() : new Date().toISOString();

  let entriesXml = '';
  
  // Render up to 10 entries matching Jekyll's limit
  for (const post of posts.slice(0, 10)) {
    const postUrl = new URL(getAssetUrl(`/${post.slug}/`), siteUrl).toString();
    const dateIso = new Date(post.data.date).toISOString();
    
    // Resolve author
    const authorKey = post.data.author as keyof typeof authors;
    const authorData = authorKey in authors ? authors[authorKey] : null;
    const authorName = authorData?.name || post.data.author;
    const authorEmail = authorData?.email || '';
    const authorUri = authorData?.url_full || '';
    
    // Clean and escape body content
    const cleanContent = (post.body || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    let authorXml = `<author><name>${authorName}</name>`;
    if (authorEmail) authorXml += `<email>${authorEmail}</email>`;
    if (authorUri) authorXml += `<uri>${authorUri}</uri>`;
    authorXml += `</author>`;

    let tagsXml = '';
    post.data.tags.forEach(t => {
      tagsXml += `<category term="${t.replace(/&/g, '&amp;')}" />`;
    });

    let mediaXml = '';
    if (post.data.cover) {
      const coverUrl = new URL(getAssetUrl(post.data.cover), siteUrl).toString();
      mediaXml = `<media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="${coverUrl}" />`;
    }

    entriesXml += `
    <entry>
      <title type="html">${post.data.title.replace(/&/g, '&amp;')}</title>
      <link href="${postUrl}" rel="alternate" type="text/html" title="${post.data.title.replace(/&/g, '&amp;')}" />
      <published>${dateIso}</published>
      <updated>${dateIso}</updated>
      <id>${postUrl}</id>
      <content type="html" xml:base="${postUrl}">${cleanContent}</content>
      ${authorXml}
      ${tagsXml}
      ${mediaXml}
    </entry>`;
  }

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">
  <generator uri="https://astro.build/">Astro</generator>
  <link href="${feedUrl}" rel="self" type="application/atom+xml" />
  <link href="${indexUrl}" rel="alternate" type="text/html" />
  <updated>${lastUpdated}</updated>
  <id>${feedUrl}</id>
  <title type="html">${SITE_CONFIG.title}</title>
  <subtitle>${SITE_CONFIG.description}</subtitle>
  ${entriesXml}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
