-- Supabase SQL setup for Design Token Extractor rating feedback.
-- Run this once in the ActiveDesk Supabase project's SQL editor
-- (https://nibzfmjwisfdmwublvyu.supabase.co) — it only touches a new,
-- isolated table and does not affect existing payments/licenses tables.

CREATE TABLE extension_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension TEXT NOT NULL DEFAULT 'design-token-extractor',
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  extension_version TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_extension_feedback_extension ON extension_feedback(extension);
CREATE INDEX idx_extension_feedback_rating ON extension_feedback(rating);

ALTER TABLE extension_feedback ENABLE ROW LEVEL SECURITY;

-- Anonymous users (the extension's anon key) may only INSERT their own
-- feedback row — no SELECT/UPDATE/DELETE, so users can't read others' notes.
CREATE POLICY "anon_can_submit_feedback"
  ON extension_feedback FOR INSERT
  WITH CHECK (true);
