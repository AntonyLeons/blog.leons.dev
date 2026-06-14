import { getCollection, getEntry } from 'astro:content';
import { SITE_CONFIG, getAssetUrl } from '../../../config';

export async function getStaticPaths() {
  const allAuthors = await getCollection('authors');
  return allAuthors.map(authorEntry => ({
    params: { author: authorEntry.id }
  }));
}

export async function GET(context: any) {
  const { author } = context.params;
  
  const authorEntry = author ? await getEntry('authors', author) : null;
  const authorData = authorEntry ? authorEntry.data : null;

  if (!authorData) {
    return new Response('Author not found', { status: 404 });
  }

  const allPosts = await getCollection('posts');
  const filteredPosts = allPosts.filter(post => post.data.author && post.data.author.id === author);
  filteredPosts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  
  const siteUrl = context.site || 'https://jekyllt.github.io/casper/';
  const feedUrl = new URL(getAssetUrl(`/author/${author}/feed.xml`), siteUrl).toString();
  const indexUrl = new URL(getAssetUrl(`/author/${author}/`), siteUrl).toString();
  const lastUpdated = filteredPosts.length > 0 ? new Date(filteredPosts[0].data.date).toISOString() : new Date().toISOString();

  let entriesXml = '';
  
  for (const post of filteredPosts.slice(0, 10)) {
    const postUrl = new URL(getAssetUrl(`/${post.slug}/`), siteUrl).toString();
    const dateIso = new Date(post.data.date).toISOString();
    
    const authorName = authorData.name;
    const authorEmail = authorData.email || '';
    const authorUri = authorData.url_full || '';
    
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
  <title type="html">${SITE_CONFIG.title} | ${authorData.name}</title>
  <subtitle>${authorData.bio || `Posts by ${authorData.name}`}</subtitle>
  ${entriesXml}
</feed>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
