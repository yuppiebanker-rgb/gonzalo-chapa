const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SITE = 'https://gchapa.com';

const STATIC_PAGES = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/pages/street', changefreq: 'monthly', priority: '0.8' },
  { url: '/pages/eventos', changefreq: 'monthly', priority: '0.8' },
  { url: '/pages/retratos', changefreq: 'monthly', priority: '0.8' },
  { url: '/pages/brookside', changefreq: 'monthly', priority: '0.8' },
  { url: '/pages/about', changefreq: 'monthly', priority: '0.7' },
  { url: '/pages/blog', changefreq: 'weekly', priority: '0.7' },
  { url: '/pages/hire', changefreq: 'monthly', priority: '0.9' },
];

function xmlUrl(loc, changefreq, priority, lastmod) {
  return [
    '  <url>',
    `    <loc>${SITE}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');

  try {
    const today = new Date().toISOString().split('T')[0];

    const [postsResult] = await Promise.all([
      supabase
        .from('blog_posts')
        .select('slug, published_at, updated_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
    ]);

    const staticUrls = STATIC_PAGES.map(p =>
      xmlUrl(p.url, p.changefreq, p.priority, today)
    );

    const blogUrls = (postsResult.data || []).map(post => {
      const lastmod = (post.updated_at || post.published_at || '').split('T')[0];
      return xmlUrl(
        `/pages/blog-post?slug=${encodeURIComponent(post.slug)}`,
        'monthly',
        '0.6',
        lastmod
      );
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticUrls,
      ...blogUrls,
      '</urlset>',
    ].join('\n');

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('sitemap error:', err);
    return res.status(500).end('Internal Server Error');
  }
};
