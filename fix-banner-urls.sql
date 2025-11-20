-- =====================================================
-- FIX ALL BROKEN BANNER IMAGE URLS
-- This removes newlines and whitespace from all URLs
-- =====================================================

-- Method 1: Clean all URLs by removing newlines and extra spaces (chained)
UPDATE projects
SET
  banner_image = regexp_replace(
    regexp_replace(banner_image, E'[\\n\\r\\t]+', '', 'g'),
    E'\\s+', '', 'g'
  ),
  updated_at = now()
WHERE banner_image ~ E'[\\n\\r\\t\\s]';

-- Verify the fix
SELECT
  name,
  banner_image,
  CASE
    WHEN banner_image ~ E'[\\n\\r]' THEN '❌ STILL HAS NEWLINES'
    ELSE '✓ CLEAN'
  END as status
FROM projects
ORDER BY display_order;

-- =====================================================
-- Alternative: Individual updates (if above doesn't work)
-- =====================================================

-- Uncomment and run these if the regex approach above fails:

-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/315691/conversions/Kawasaki-tear-xs.jpg' WHERE name = 'Kawasaki - The Wrapper';
-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/292352/conversions/Elsa-H-Harpers-anderson-house-069-xs.jpg' WHERE name = 'Elsa Hosk Harpers - Bazaar - Anderson House';
-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/294121/conversions/wsj-ryan-gosling-xs.jpg' WHERE name = 'Ryan Gosling - Wall Street Journal - Retro 6';
-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/300187/conversions/vf-selena-gomez001-xs.jpg' WHERE name = 'Selena Gomez - Vanity Fair - Hermosa House';
-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/307178/conversions/mariah-carey-vogue-xs.jpg' WHERE name = 'Mariah Carey - Vogue - Americana 348';
-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/309882/conversions/Empty-Suberbia-mcDonalds012-xs.jpg' WHERE name = 'Crawford & Co Productions - McDonalds - Empty Suberbia';
-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/310242/conversions/Lady-Gaga-Mayhem-ELLE-Magazine-xs.jpg' WHERE name = 'Lady Gaga - Elle Magazine - Hearst House';
-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/291133/conversions/beyonc-covers-xs.jpg' WHERE name = 'Beyonce - W Magazine';
-- UPDATE projects SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/287032/conversions/LivingProof-PH001-xs.jpg' WHERE name = 'Paris Hilton - Living Proof';
