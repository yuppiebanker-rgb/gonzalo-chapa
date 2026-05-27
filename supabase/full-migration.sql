-- =============================================================
-- Gonzalo Chapa Portfolio — Full Migration (idempotent)
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. COLLECTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 2. PHOTOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id  UUID REFERENCES collections(id) ON DELETE CASCADE,
  image_url      TEXT NOT NULL,
  filename       TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 3. HERO SLIDES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hero_slides (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url       TEXT NOT NULL,
  location_label  TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 4. SERVICES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  name_en          TEXT,
  description      TEXT,
  type             TEXT NOT NULL DEFAULT 'package' CHECK (type IN ('hourly','package','addon')),
  base_price_mxn   INTEGER NOT NULL DEFAULT 0,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 5. BLOG CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 6. BLOG POSTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  excerpt          TEXT,
  body             TEXT,
  category_id      UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  cover_image_url  TEXT,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 7. QUOTES (cotizaciones)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name   TEXT NOT NULL,
  client_email  TEXT,
  client_phone  TEXT,
  service_type  TEXT,
  event_date    TEXT,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','viewed','accepted','rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 8. MESSAGES (contacto)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name   TEXT NOT NULL,
  sender_email  TEXT,
  subject       TEXT,
  body          TEXT,
  status        TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 9. SITE SETTINGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_text           TEXT DEFAULT 'G. Chapa',
  site_title          TEXT DEFAULT 'Gonzalo Chapa Photography',
  site_description    TEXT DEFAULT 'Fotógrafo basado en Monterrey, México.',
  phone               TEXT DEFAULT '+52 81 8799 7500',
  email               TEXT DEFAULT 'gchapa2602@gmail.com',
  instagram_handle    TEXT DEFAULT 'my_memories.jpeg',
  whatsapp_number     TEXT DEFAULT '528187997500',
  primary_color       TEXT DEFAULT '#c0a46e',
  accent_color        TEXT DEFAULT '#f4efe6',
  font_heading        TEXT DEFAULT 'Cormorant Garamond',
  font_body           TEXT DEFAULT 'DM Sans',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 10. THEME PRESETS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS theme_presets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  primary_color  TEXT NOT NULL,
  accent_color   TEXT NOT NULL,
  font_heading   TEXT,
  font_body      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 11. PAGE SEO
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_seo (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug        TEXT NOT NULL UNIQUE,
  page_title       TEXT,
  meta_title       TEXT,
  meta_description TEXT,
  og_image_url     TEXT,
  canonical_url    TEXT,
  noindex          BOOLEAN NOT NULL DEFAULT false,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 12. PAGE VIEWS (analíticas)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_views (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page             TEXT NOT NULL,
  date             DATE NOT NULL DEFAULT CURRENT_DATE,
  views            INTEGER NOT NULL DEFAULT 0,
  unique_visitors  INTEGER NOT NULL DEFAULT 0,
  UNIQUE(page, date)
);

-- ─────────────────────────────────────────────
-- 13. SECTION VISIBILITY
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS section_visibility (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key    TEXT NOT NULL,
  section_label  TEXT NOT NULL,
  page           TEXT NOT NULL,
  visible        BOOLEAN NOT NULL DEFAULT true,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(page, section_key)
);

-- ─────────────────────────────────────────────
-- 14. NAV ITEMS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nav_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  label_en    TEXT,
  href        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_cta      BOOLEAN NOT NULL DEFAULT false,
  visible     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- 15. PAGE SECTIONS (CMS content blocks)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS page_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug     TEXT NOT NULL,
  section_key   TEXT NOT NULL,
  section_type  TEXT NOT NULL DEFAULT 'text',
  title         TEXT,
  content       TEXT,
  image_url     TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page_slug, section_key)
);

-- ─────────────────────────────────────────────
-- 16. ABOUT CONTENT (dynamic about page)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS about_content (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline      TEXT NOT NULL DEFAULT 'Every frame is a <em>declaration</em> of where we are.',
  subheadline   TEXT NOT NULL DEFAULT 'Fotógrafo · Monterrey, México',
  bio_text      TEXT NOT NULL DEFAULT '',
  portrait_url  TEXT NOT NULL DEFAULT '../assets/images/retratos/_DSC8665.jpg',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================
-- RLS POLICIES
-- =============================================================

ALTER TABLE collections        ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides        ENABLE ROW LEVEL SECURITY;
ALTER TABLE services           ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_presets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_seo           ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views         ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_visibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content      ENABLE ROW LEVEL SECURITY;

-- Public read on portfolio-facing tables
DO $$
BEGIN
  -- collections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='collections' AND policyname='public_read_collections') THEN
    CREATE POLICY public_read_collections ON collections FOR SELECT USING (true);
  END IF;
  -- photos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='photos' AND policyname='public_read_photos') THEN
    CREATE POLICY public_read_photos ON photos FOR SELECT USING (true);
  END IF;
  -- hero_slides
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hero_slides' AND policyname='public_read_hero') THEN
    CREATE POLICY public_read_hero ON hero_slides FOR SELECT USING (true);
  END IF;
  -- services
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='services' AND policyname='public_read_services') THEN
    CREATE POLICY public_read_services ON services FOR SELECT USING (active = true);
  END IF;
  -- blog_categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_categories' AND policyname='public_read_blog_cats') THEN
    CREATE POLICY public_read_blog_cats ON blog_categories FOR SELECT USING (active = true);
  END IF;
  -- blog_posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_posts' AND policyname='public_read_blog_posts') THEN
    CREATE POLICY public_read_blog_posts ON blog_posts FOR SELECT USING (status = 'published');
  END IF;
  -- site_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='public_read_settings') THEN
    CREATE POLICY public_read_settings ON site_settings FOR SELECT USING (true);
  END IF;
  -- theme_presets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_presets' AND policyname='public_read_presets') THEN
    CREATE POLICY public_read_presets ON theme_presets FOR SELECT USING (true);
  END IF;
  -- page_seo
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_seo' AND policyname='public_read_page_seo') THEN
    CREATE POLICY public_read_page_seo ON page_seo FOR SELECT USING (true);
  END IF;
  -- section_visibility
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='section_visibility' AND policyname='public_read_sections') THEN
    CREATE POLICY public_read_sections ON section_visibility FOR SELECT USING (true);
  END IF;
  -- nav_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nav_items' AND policyname='public_read_nav') THEN
    CREATE POLICY public_read_nav ON nav_items FOR SELECT USING (visible = true);
  END IF;
  -- page_sections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_sections' AND policyname='public_read_page_sections') THEN
    CREATE POLICY public_read_page_sections ON page_sections FOR SELECT USING (true);
  END IF;
  -- about_content
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='about_content' AND policyname='public_read_about') THEN
    CREATE POLICY public_read_about ON about_content FOR SELECT USING (true);
  END IF;
  -- quotes: public insert only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quotes' AND policyname='public_insert_quotes') THEN
    CREATE POLICY public_insert_quotes ON quotes FOR INSERT WITH CHECK (true);
  END IF;
  -- messages: public insert only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='messages' AND policyname='public_insert_messages') THEN
    CREATE POLICY public_insert_messages ON messages FOR INSERT WITH CHECK (true);
  END IF;
  -- page_views: public insert/update
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_views' AND policyname='public_upsert_views') THEN
    CREATE POLICY public_upsert_views ON page_views FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- =============================================================
-- SEED DATA
-- =============================================================

-- Site settings (single row)
INSERT INTO site_settings (
  logo_text, site_title, site_description,
  phone, email, instagram_handle, whatsapp_number,
  primary_color, accent_color, font_heading, font_body
)
SELECT
  'G. Chapa', 'Gonzalo Chapa Photography',
  'Fotógrafo basado en San Pedro Garza García, Monterrey, México.',
  '+52 81 8799 7500', 'gchapa2602@gmail.com',
  'my_memories.jpeg', '528187997500',
  '#c0a46e', '#f4efe6', 'Cormorant Garamond', 'DM Sans'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

-- Theme presets
INSERT INTO theme_presets (name, primary_color, accent_color, font_heading, font_body, is_active)
SELECT 'Oscuro Dorado', '#c0a46e', '#f4efe6', 'Cormorant Garamond', 'DM Sans', true
WHERE NOT EXISTS (SELECT 1 FROM theme_presets WHERE name = 'Oscuro Dorado');

INSERT INTO theme_presets (name, primary_color, accent_color, font_heading, font_body, is_active)
SELECT 'Plata Fría', '#a0a8b0', '#e8eaec', 'Bodoni Moda', 'DM Sans', false
WHERE NOT EXISTS (SELECT 1 FROM theme_presets WHERE name = 'Plata Fría');

INSERT INTO theme_presets (name, primary_color, accent_color, font_heading, font_body, is_active)
SELECT 'Sepia Cálido', '#b8956a', '#f5ede0', 'Cormorant Garamond', 'DM Sans', false
WHERE NOT EXISTS (SELECT 1 FROM theme_presets WHERE name = 'Sepia Cálido');

-- Collections
INSERT INTO collections (name, slug, sort_order)
SELECT 'Street', 'street', 1
WHERE NOT EXISTS (SELECT 1 FROM collections WHERE slug = 'street');

INSERT INTO collections (name, slug, sort_order)
SELECT 'Eventos', 'eventos', 2
WHERE NOT EXISTS (SELECT 1 FROM collections WHERE slug = 'eventos');

INSERT INTO collections (name, slug, sort_order)
SELECT 'Retratos', 'retratos', 3
WHERE NOT EXISTS (SELECT 1 FROM collections WHERE slug = 'retratos');

INSERT INTO collections (name, slug, sort_order)
SELECT 'Brookside', 'brookside', 4
WHERE NOT EXISTS (SELECT 1 FROM collections WHERE slug = 'brookside');

-- Navigation items
INSERT INTO nav_items (label, label_en, href, sort_order, is_cta, visible)
SELECT 'Street', 'Street', 'pages/street.html', 1, false, true
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = 'pages/street.html');

INSERT INTO nav_items (label, label_en, href, sort_order, is_cta, visible)
SELECT 'Eventos', 'Events', 'pages/eventos.html', 2, false, true
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = 'pages/eventos.html');

INSERT INTO nav_items (label, label_en, href, sort_order, is_cta, visible)
SELECT 'Retratos', 'Portraits', 'pages/retratos.html', 3, false, true
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = 'pages/retratos.html');

INSERT INTO nav_items (label, label_en, href, sort_order, is_cta, visible)
SELECT 'Brookside', 'Brookside', 'pages/brookside.html', 4, false, true
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = 'pages/brookside.html');

INSERT INTO nav_items (label, label_en, href, sort_order, is_cta, visible)
SELECT 'Services', 'Services', 'pages/hire.html', 5, true, true
WHERE NOT EXISTS (SELECT 1 FROM nav_items WHERE href = 'pages/hire.html');

-- SEO — one row per page
INSERT INTO page_seo (page_slug, page_title, meta_title, meta_description, canonical_url)
SELECT 'home', 'Home', 'Gonzalo Chapa — Fotógrafo Monterrey',
  'Fotografía de calle, eventos y retratos en Monterrey, México.',
  'https://gchapa.com/'
WHERE NOT EXISTS (SELECT 1 FROM page_seo WHERE page_slug = 'home');

INSERT INTO page_seo (page_slug, page_title, meta_title, meta_description, canonical_url)
SELECT 'about', 'About', 'About — Gonzalo Chapa',
  'About Gonzalo Chapa — Photographer from Monterrey, México.',
  'https://gchapa.com/pages/about.html'
WHERE NOT EXISTS (SELECT 1 FROM page_seo WHERE page_slug = 'about');

INSERT INTO page_seo (page_slug, page_title, meta_title, meta_description, canonical_url)
SELECT 'street', 'Street', 'Street Photography — Gonzalo Chapa',
  'Street photography from Monterrey and northern México.',
  'https://gchapa.com/pages/street.html'
WHERE NOT EXISTS (SELECT 1 FROM page_seo WHERE page_slug = 'street');

INSERT INTO page_seo (page_slug, page_title, meta_title, meta_description, canonical_url)
SELECT 'eventos', 'Eventos', 'Fotografía de Eventos — Gonzalo Chapa',
  'Cobertura fotográfica de eventos en Monterrey.',
  'https://gchapa.com/pages/eventos.html'
WHERE NOT EXISTS (SELECT 1 FROM page_seo WHERE page_slug = 'eventos');

INSERT INTO page_seo (page_slug, page_title, meta_title, meta_description, canonical_url)
SELECT 'retratos', 'Retratos', 'Retratos — Gonzalo Chapa',
  'Fotografía de retratos en Monterrey.',
  'https://gchapa.com/pages/retratos.html'
WHERE NOT EXISTS (SELECT 1 FROM page_seo WHERE page_slug = 'retratos');

INSERT INTO page_seo (page_slug, page_title, meta_title, meta_description, canonical_url)
SELECT 'hire', 'Servicios', 'Servicios — Gonzalo Chapa',
  'Paquetes y precios de fotografía profesional en Monterrey.',
  'https://gchapa.com/pages/hire.html'
WHERE NOT EXISTS (SELECT 1 FROM page_seo WHERE page_slug = 'hire');

-- Services
INSERT INTO services (name, name_en, description, type, base_price_mxn, sort_order, active)
SELECT 'Sesión de Retratos', 'Portrait Session',
  '2 horas, 30 fotos editadas entregadas en galería privada.',
  'package', 350000, 1, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Sesión de Retratos');

INSERT INTO services (name, name_en, description, type, base_price_mxn, sort_order, active)
SELECT 'Cobertura de Evento', 'Event Coverage',
  '4 horas mínimo, galería completa, entrega en 7 días.',
  'package', 800000, 2, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Cobertura de Evento');

INSERT INTO services (name, name_en, description, type, base_price_mxn, sort_order, active)
SELECT 'Hora Adicional', 'Extra Hour',
  'Por hora adicional en cualquier cobertura.',
  'addon', 150000, 3, true
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = 'Hora Adicional');

-- Section visibility
INSERT INTO section_visibility (section_key, section_label, page, visible, sort_order)
SELECT 'hero', 'Hero Slideshow', 'home', true, 1
WHERE NOT EXISTS (SELECT 1 FROM section_visibility WHERE page = 'home' AND section_key = 'hero');

INSERT INTO section_visibility (section_key, section_label, page, visible, sort_order)
SELECT 'collections', 'Galería de Colecciones', 'home', true, 2
WHERE NOT EXISTS (SELECT 1 FROM section_visibility WHERE page = 'home' AND section_key = 'collections');

INSERT INTO section_visibility (section_key, section_label, page, visible, sort_order)
SELECT 'services', 'Servicios', 'home', true, 3
WHERE NOT EXISTS (SELECT 1 FROM section_visibility WHERE page = 'home' AND section_key = 'services');

INSERT INTO section_visibility (section_key, section_label, page, visible, sort_order)
SELECT 'contact', 'Contacto / WhatsApp', 'home', true, 4
WHERE NOT EXISTS (SELECT 1 FROM section_visibility WHERE page = 'home' AND section_key = 'contact');

INSERT INTO section_visibility (section_key, section_label, page, visible, sort_order)
SELECT 'bio', 'Sección Bio', 'about', true, 1
WHERE NOT EXISTS (SELECT 1 FROM section_visibility WHERE page = 'about' AND section_key = 'bio');

INSERT INTO section_visibility (section_key, section_label, page, visible, sort_order)
SELECT 'selected_work', 'Selected Work', 'about', true, 2
WHERE NOT EXISTS (SELECT 1 FROM section_visibility WHERE page = 'about' AND section_key = 'selected_work');

-- About content (single row)
INSERT INTO about_content (headline, subheadline, bio_text, portrait_url)
SELECT
  'Every frame is a <em>declaration</em> of where we are.',
  'Fotógrafo · Monterrey, México',
  '<p>Gonzalo Chapa is a photographer based in San Pedro Garza García, Monterrey. His work documents the energy of northern México — from the masked characters of its streets to the neon-lit underground of its nightlife and the raw landscape of the Sierra Madre.</p><p>His practice is built on trust, patience, and a refusal to pose the world. Whether documenting a concert, shooting a portrait, or walking a carretera at dusk, he brings the same editorial eye: honest, bold, and rooted in place.</p>',
  '../assets/images/retratos/_DSC8665.jpg'
WHERE NOT EXISTS (SELECT 1 FROM about_content);

-- Blog categories seed
INSERT INTO blog_categories (name, slug, sort_order, active)
SELECT 'Fotografía', 'fotografia', 1, true
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE slug = 'fotografia');

INSERT INTO blog_categories (name, slug, sort_order, active)
SELECT 'Detrás de Cámaras', 'detras-de-camaras', 2, true
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE slug = 'detras-de-camaras');

INSERT INTO blog_categories (name, slug, sort_order, active)
SELECT 'Monterrey', 'monterrey', 3, true
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE slug = 'monterrey');

INSERT INTO blog_categories (name, slug, sort_order, active)
SELECT 'Técnica', 'tecnica', 4, true
WHERE NOT EXISTS (SELECT 1 FROM blog_categories WHERE slug = 'tecnica');

-- Page sections seed (CMS content blocks)
INSERT INTO page_sections (page_slug, section_key, section_type, title, content, sort_order)
SELECT 'home', 'hero_headline', 'text', 'Titular Principal',
  'Fotografía que captura la esencia de cada momento.', 1
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_slug = 'home' AND section_key = 'hero_headline');

INSERT INTO page_sections (page_slug, section_key, section_type, title, content, sort_order)
SELECT 'home', 'hero_subheadline', 'text', 'Subtítulo Hero',
  'Monterrey, México', 2
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_slug = 'home' AND section_key = 'hero_subheadline');

INSERT INTO page_sections (page_slug, section_key, section_type, title, content, sort_order)
SELECT 'about', 'bio_headline', 'text', 'Titular Bio',
  'Every frame is a declaration of where we are.', 1
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_slug = 'about' AND section_key = 'bio_headline');

INSERT INTO page_sections (page_slug, section_key, section_type, title, content, sort_order)
SELECT 'about', 'bio_body', 'html', 'Texto Bio',
  '<p>Fotógrafo basado en San Pedro Garza García, Monterrey. Documenta la energía del norte de México.</p>', 2
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_slug = 'about' AND section_key = 'bio_body');

INSERT INTO page_sections (page_slug, section_key, section_type, title, content, sort_order)
SELECT 'hire', 'intro_title', 'text', 'Título Servicios',
  'Servicios Fotográficos', 1
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_slug = 'hire' AND section_key = 'intro_title');

INSERT INTO page_sections (page_slug, section_key, section_type, title, content, sort_order)
SELECT 'hire', 'intro_body', 'text', 'Intro Servicios',
  'Paquetes diseñados para cada ocasión.', 2
WHERE NOT EXISTS (SELECT 1 FROM page_sections WHERE page_slug = 'hire' AND section_key = 'intro_body');

-- =============================================================
-- AUTHENTICATED USER POLICIES (admin CRUD access)
-- Without these, logged-in admin users cannot write to any table.
-- =============================================================
DO $$
BEGIN
  -- collections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='collections' AND policyname='auth_manage_collections') THEN
    CREATE POLICY auth_manage_collections ON collections FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- photos
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='photos' AND policyname='auth_manage_photos') THEN
    CREATE POLICY auth_manage_photos ON photos FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- hero_slides
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='hero_slides' AND policyname='auth_manage_hero') THEN
    CREATE POLICY auth_manage_hero ON hero_slides FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- services
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='services' AND policyname='auth_manage_services') THEN
    CREATE POLICY auth_manage_services ON services FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- blog_categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_categories' AND policyname='auth_manage_blog_cats') THEN
    CREATE POLICY auth_manage_blog_cats ON blog_categories FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- blog_posts
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blog_posts' AND policyname='auth_manage_blog_posts') THEN
    CREATE POLICY auth_manage_blog_posts ON blog_posts FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- quotes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='quotes' AND policyname='auth_manage_quotes') THEN
    CREATE POLICY auth_manage_quotes ON quotes FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- messages
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='messages' AND policyname='auth_manage_messages') THEN
    CREATE POLICY auth_manage_messages ON messages FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- site_settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='site_settings' AND policyname='auth_manage_settings') THEN
    CREATE POLICY auth_manage_settings ON site_settings FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- theme_presets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='theme_presets' AND policyname='auth_manage_presets') THEN
    CREATE POLICY auth_manage_presets ON theme_presets FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- page_seo
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_seo' AND policyname='auth_manage_page_seo') THEN
    CREATE POLICY auth_manage_page_seo ON page_seo FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- page_views
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_views' AND policyname='auth_manage_views') THEN
    CREATE POLICY auth_manage_views ON page_views FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- section_visibility
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='section_visibility' AND policyname='auth_manage_sections') THEN
    CREATE POLICY auth_manage_sections ON section_visibility FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- nav_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nav_items' AND policyname='auth_manage_nav') THEN
    CREATE POLICY auth_manage_nav ON nav_items FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- page_sections
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='page_sections' AND policyname='auth_manage_page_sections') THEN
    CREATE POLICY auth_manage_page_sections ON page_sections FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
  -- about_content
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='about_content' AND policyname='auth_manage_about') THEN
    CREATE POLICY auth_manage_about ON about_content FOR ALL
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- =============================================================
-- STORAGE BUCKET (photos)
-- Run after tables are created. Creates the public "photos" bucket
-- and sets policies for public read + authenticated write.
-- =============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos', 'photos', true,
  10485760,  -- 10 MB per file
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='photos_public_read') THEN
    CREATE POLICY photos_public_read ON storage.objects FOR SELECT USING (bucket_id = 'photos');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='photos_auth_upload') THEN
    CREATE POLICY photos_auth_upload ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='photos_auth_delete') THEN
    CREATE POLICY photos_auth_delete ON storage.objects FOR DELETE
      USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='photos_auth_update') THEN
    CREATE POLICY photos_auth_update ON storage.objects FOR UPDATE
      USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
  END IF;
END $$;
