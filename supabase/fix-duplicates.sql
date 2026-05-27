-- =============================================================
-- Gonzalo Chapa Portfolio — Deduplication Fix
-- Run once in Supabase SQL Editor.
-- Keeps the OLDEST row per unique key; deletes all later dupes.
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. nav_items — keep one row per href
-- ─────────────────────────────────────────────
DELETE FROM nav_items
WHERE id NOT IN (
  SELECT DISTINCT ON (href) id
  FROM nav_items
  ORDER BY href, created_at ASC
);

-- ─────────────────────────────────────────────
-- 2. section_visibility — keep one row per (page, section_key)
-- ─────────────────────────────────────────────
DELETE FROM section_visibility
WHERE id NOT IN (
  SELECT DISTINCT ON (page, section_key) id
  FROM section_visibility
  ORDER BY page, section_key, sort_order ASC
);

-- ─────────────────────────────────────────────
-- 3. page_seo — keep one row per page_slug
-- ─────────────────────────────────────────────
DELETE FROM page_seo
WHERE id NOT IN (
  SELECT DISTINCT ON (page_slug) id
  FROM page_seo
  ORDER BY page_slug, updated_at ASC
);

-- ─────────────────────────────────────────────
-- 4. Remove test collection "kkkk" and its photos
-- ─────────────────────────────────────────────
DELETE FROM photos
WHERE collection_id IN (
  SELECT id FROM collections WHERE slug = 'kkkk' OR name = 'kkkk'
);

DELETE FROM collections
WHERE slug = 'kkkk' OR name = 'kkkk';

-- ─────────────────────────────────────────────
-- Verify counts after cleanup
-- ─────────────────────────────────────────────
SELECT 'nav_items'          AS tbl, COUNT(*) AS rows FROM nav_items
UNION ALL
SELECT 'section_visibility' AS tbl, COUNT(*) AS rows FROM section_visibility
UNION ALL
SELECT 'page_seo'           AS tbl, COUNT(*) AS rows FROM page_seo
UNION ALL
SELECT 'collections'        AS tbl, COUNT(*) AS rows FROM collections;
