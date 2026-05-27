#!/usr/bin/env node
/**
 * seed-photos.js — Seeds photos from local assets into Supabase
 *
 * Usage:
 *   $env:SUPABASE_SERVICE_KEY="your-service-role-key"; node scripts/seed-photos.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SB_URL = 'https://pxqugqerodswtkgxzipw.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SB_KEY) {
  console.error('❌  SUPABASE_SERVICE_KEY env var is required.');
  console.error('    Run: $env:SUPABASE_SERVICE_KEY="your-key"; node scripts/seed-photos.js');
  process.exit(1);
}

const sb = createClient(SB_URL, SB_KEY);

const COLLECTIONS = ['street', 'eventos', 'retratos', 'brookside'];
const ROOT = path.join(__dirname, '..', 'assets', 'images');
const BUCKET = 'photos';

// Hero slide picks: 2 from street/eventos, 1 from retratos/brookside (= 6, capped at 5)
const HERO_PICKS = new Set([
  '1-_DSC7572.jpg',     // street — strong opener
  '10-DSC02636.jpg',    // street — urban texture
  '3-_DSC6845.jpg',     // eventos — event energy
  '5-_DSC5961.jpg',     // eventos — nightlife
  '1-_DSC8641.jpg',     // retratos — portrait
]);

async function main() {
  const heroQueue = [];  // { image_url } accumulated during upload loop

  for (const slug of COLLECTIONS) {
    const dir = path.join(ROOT, slug);
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️   Directory not found, skipping: ${dir}`);
      continue;
    }

    // Resolve collection row
    const { data: col, error: colErr } = await sb
      .from('collections')
      .select('id, slug')
      .eq('slug', slug)
      .single();

    if (colErr || !col) {
      console.error(`❌  Collection "${slug}" not found in DB:`, colErr?.message ?? 'no row');
      continue;
    }

    // Existing photos to detect duplicates
    const { data: existing } = await sb
      .from('photos')
      .select('filename')
      .eq('collection_id', col.id);

    const existingSet = new Set((existing || []).map((r) => r.filename));
    const startOrder = existingSet.size;

    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g)$/i.test(f))
      .sort();

    console.log(`\n📂  ${slug}  (${files.length} files)`);

    let counter = startOrder;

    for (const filename of files) {
      if (existingSet.has(filename)) {
        console.log(`  ↷  skip  ${filename}`);
        continue;
      }

      const filePath = path.join(dir, filename);
      const fileData = fs.readFileSync(filePath);
      const storagePath = `${slug}/${filename}`;

      // Upload (ignore "already exists" — may happen if DB row is missing)
      const { error: uploadErr } = await sb.storage
        .from(BUCKET)
        .upload(storagePath, fileData, { contentType: 'image/jpeg', upsert: false });

      if (uploadErr && !uploadErr.message.includes('already exists')) {
        console.error(`  ❌  upload  ${filename}:`, uploadErr.message);
        continue;
      }

      const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
      const image_url = urlData.publicUrl;

      const { error: insertErr } = await sb.from('photos').insert({
        collection_id: col.id,
        filename,
        image_url,
        sort_order: counter,
      });

      if (insertErr) {
        console.error(`  ❌  insert  ${filename}:`, insertErr.message);
        continue;
      }

      console.log(`  ✓  ${filename}`);
      counter++;

      if (HERO_PICKS.has(filename)) {
        heroQueue.push({ image_url });
      }
    }
  }

  // ── Hero slides ─────────────────────────────────────────────────────
  console.log('\n🎬  Seeding hero_slides…');

  const { data: existingHeroes } = await sb.from('hero_slides').select('image_url');
  const existingHeroUrls = new Set((existingHeroes || []).map((r) => r.image_url));

  const toInsert = heroQueue
    .filter((h) => !existingHeroUrls.has(h.image_url))
    .slice(0, 5)
    .map((h, i) => ({ image_url: h.image_url, sort_order: i }));

  if (toInsert.length === 0) {
    console.log('  ↷  all hero slides already exist or no hero images were uploaded');
  } else {
    const { error: heroErr } = await sb.from('hero_slides').insert(toInsert);
    if (heroErr) {
      console.error('  ❌  hero_slides insert:', heroErr.message);
    } else {
      console.log(`  ✓  inserted ${toInsert.length} hero slide(s)`);
    }
  }

  console.log('\n✅  Seed complete.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
