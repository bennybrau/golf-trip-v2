-- Backfills Photo.year from the caption where a year can be determined with
-- confidence. Idempotent: guarded on "year" IS NULL, so re-running is a no-op.
--
-- DELIBERATELY NOT falling back to EXTRACT(YEAR FROM "createdAt"). Every existing
-- photo was bulk-imported from Cloudflare on a single date, so createdAt reflects
-- the import, not the trip -- using it would stamp photos captioned "operator-2020"
-- and "ryan-f-2021" as the import year. A NULL year is accurate ("unknown"); a
-- wrong year is a fabrication that looks authoritative once it renders in the
-- gallery. Un-backfilled photos surface as "Unsorted" and can be assigned by hand.
--
-- Captions look like 'Imported from Cloudflare: quigs-2023.jpeg'. Camera-roll
-- filenames (IMG_0474, Image_000417, DSC_2016, PXL_20240101) are stripped first,
-- because their numeric runs can otherwise be misread as years.

UPDATE "Photo"
SET "year" = CAST(
      substring(
        regexp_replace("caption", '(IMG|Image|DSC|DSCN|PXL|MVIMG|VID)[_-]?[0-9]+', '', 'gi')
        from '\y(20[0-2][0-9])\y'
      ) AS INTEGER
    )
WHERE "year" IS NULL
  AND "caption" IS NOT NULL
  AND regexp_replace("caption", '(IMG|Image|DSC|DSCN|PXL|MVIMG|VID)[_-]?[0-9]+', '', 'gi')
      ~ '\y20[0-2][0-9]\y';

-- Guard against a caption yielding an implausible year (e.g. a stray "2003" in a
-- filename). Anything outside the trip's lifetime is reverted to unknown rather
-- than left as a plausible-looking wrong value.
UPDATE "Photo"
SET "year" = NULL
WHERE "year" IS NOT NULL
  AND ("year" < 2015 OR "year" > EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER + 1);
