-- Create beach_content table for AI-generated narrative content.
--
-- Separate from `beaches` so AI-generated prose can be regenerated and
-- versioned without touching human-verified structured beach data. One
-- row per beach. Foreign key cascades on delete.

CREATE TABLE IF NOT EXISTS public.beach_content (
  beach_id          UUID PRIMARY KEY REFERENCES public.beaches(id) ON DELETE CASCADE,
  overview          TEXT NOT NULL,
  amenities_summary TEXT,
  faqs              JSONB NOT NULL DEFAULT '[]'::JSONB,
  keywords          TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generator         TEXT NOT NULL,
  prompt_version    TEXT NOT NULL,
  human_edited      BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS beach_content_generator_idx
  ON public.beach_content(generator);
CREATE INDEX IF NOT EXISTS beach_content_prompt_version_idx
  ON public.beach_content(prompt_version);
CREATE INDEX IF NOT EXISTS beach_content_human_edited_idx
  ON public.beach_content(human_edited);

-- RLS policies — mirror the public-can-view-active / admins-can-write
-- pattern used on the beaches table.

ALTER TABLE public.beach_content ENABLE ROW LEVEL SECURITY;

-- Public can read content for any ACTIVE beach. The visibility decision
-- piggy-backs on beaches.status so hidden/draft beaches stay hidden.
CREATE POLICY "Public can view content for active beaches"
ON public.beach_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.beaches b
    WHERE b.id = beach_content.beach_id
      AND b.status = 'ACTIVE'
  )
);

-- Admins can see all content (including for hidden/draft beaches).
CREATE POLICY "Admins can view all beach content"
ON public.beach_content
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert beach content"
ON public.beach_content
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update beach content"
ON public.beach_content
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete beach content"
ON public.beach_content
FOR DELETE
TO authenticated
USING (public.is_admin());
