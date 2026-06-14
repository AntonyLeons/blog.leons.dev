import { getEntry } from 'astro:content';
import { getAssetUrl } from '../config';

interface FeedOptions {
  title: string;
  description: string;
  feedUrl: string;
  indexUrl: string;
  siteUrl: string;
}

export async function generateAtomFeed(posts: any[], options: FeedOptions): Promise<Response> {
  const { title, description, feedUrl, indexUrl, siteUrl } = options;
  const lastUpdated = posts.length > 0 ? new Date(posts[0].data.date).toISOString() : new Date().toISOString();

  let entriesXml = '';
  
  for (const post of posts.slice(0, 10)) {
    const postUrl = new URL(getAssetUrl(`/${post.id}/`), siteUrl).toString();
    const dateIso = new Date(post.data.date).toISOString();
    
    // Resolve author
    const authorEntry = post.data.author ? await getEntry(post.data.author) : null;
    const authorData = authorEntry ? authorEntry.data : null;
    const authorName = authorData?.name || (post.data.author?.id || '');
    const authorEmail = (authorData as any)?.email || '';
    const authorUri = typeof authorData?.url_full === 'string' ? authorData.url_full : '';
    
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
    post.data.tags.forEach((t: string) => {
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
  <title type="html">${title}</title>
  <subtitle>${description}</subtitle>
  ${entriesXml}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
