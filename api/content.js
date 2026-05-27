const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [settings, collections, heroSlides, services, about, navItems, sections] = await Promise.all([
      supabase.from('site_settings').select('*').limit(1).single(),
      supabase.from('collections').select('*, photos(*)').eq('active', true).order('sort_order'),
      supabase.from('hero_slides').select('*').eq('active', true).order('sort_order'),
      supabase.from('services').select('*').eq('active', true).order('sort_order'),
      supabase.from('about_content').select('*').limit(1).single(),
      supabase.from('nav_items').select('*').eq('visible', true).order('sort_order'),
      supabase.from('section_visibility').select('*').order('sort_order')
    ]);

    // Sort photos within each collection
    if (collections.data) {
      collections.data.forEach(c => {
        if (c.photos) {
          c.photos = c.photos.filter(p => p.active).sort((a, b) => a.sort_order - b.sort_order);
        }
      });
    }

    return res.status(200).json({
      settings: settings.data || {},
      collections: collections.data || [],
      hero: heroSlides.data || [],
      services: (services.data || []).map(s => ({
        ...s,
        price_display: (s.base_price_mxn / 100).toLocaleString('es-MX'),
        price_mxn: s.base_price_mxn / 100
      })),
      about: about.data || {},
      nav: navItems.data || [],
      sections: sections.data || []
    });
  } catch (err) {
    console.error('Content API error:', err);
    return res.status(500).json({ error: 'Failed to fetch content' });
  }
};
