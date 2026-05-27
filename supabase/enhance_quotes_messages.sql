-- ─────────────────────────────────────────────
-- Enhance quotes: add detail fields from contact form
-- Run in Supabase Dashboard > SQL Editor
-- ─────────────────────────────────────────────
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS budget   TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS hours    TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS message  TEXT;

-- ─────────────────────────────────────────────
-- Enhance messages: add reply fields + expand status
-- ─────────────────────────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_text  TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS replied_at  TIMESTAMPTZ;

-- Expand status constraint to include replied + archived
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check
  CHECK (status IN ('unread', 'read', 'replied', 'archived'));
