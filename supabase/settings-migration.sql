-- settings-migration.sql
-- Adds new columns to site_settings and about_content tables

ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS site_language TEXT DEFAULT 'es',
  ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT '© 2025 Gonzalo Chapa. Todos los derechos reservados.',
  ADD COLUMN IF NOT EXISTS social_tiktok TEXT,
  ADD COLUMN IF NOT EXISTS social_youtube TEXT,
  ADD COLUMN IF NOT EXISTS social_facebook TEXT,
  ADD COLUMN IF NOT EXISTS social_twitter TEXT,
  ADD COLUMN IF NOT EXISTS social_linkedin TEXT,
  ADD COLUMN IF NOT EXISTS google_analytics_id TEXT,
  ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS custom_css TEXT,
  ADD COLUMN IF NOT EXISTS custom_js TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;

ALTER TABLE about_content
  ADD COLUMN IF NOT EXISTS bio_text_en TEXT,
  ADD COLUMN IF NOT EXISTS equipment_list JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS fun_facts JSONB DEFAULT '[]';
