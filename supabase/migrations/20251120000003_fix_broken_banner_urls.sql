/*
  # Fix Broken Banner Image URLs

  This migration fixes banner_image URLs that contain newline characters
  and whitespace, which cause images to fail loading.

  Problem: Some URLs have embedded newlines like:
  "https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/315691/con\n  versions/Kawasaki-tear-xs.jpg"

  Solution: Update each URL to remove newlines and extra whitespace
*/

-- Fix Kawasaki - The Wrapper
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/315691/conversions/Kawasaki-tear-xs.jpg',
    updated_at = now()
WHERE name = 'Kawasaki - The Wrapper';

-- Fix Elsa Hosk Harpers - Bazaar - Anderson House
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/292352/conversions/Elsa-H-Harpers-anderson-house-069-xs.jpg',
    updated_at = now()
WHERE name = 'Elsa Hosk Harpers - Bazaar - Anderson House';

-- Fix Ryan Gosling - Wall Street Journal - Retro 6
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/294121/conversions/wsj-ryan-gosling-xs.jpg',
    updated_at = now()
WHERE name = 'Ryan Gosling - Wall Street Journal - Retro 6';

-- Fix Selena Gomez - Vanity Fair - Hermosa House
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/300187/conversions/vf-selena-gomez001-xs.jpg',
    updated_at = now()
WHERE name = 'Selena Gomez - Vanity Fair - Hermosa House';

-- Fix Mariah Carey - Vogue - Americana 348
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/307178/conversions/mariah-carey-vogue-xs.jpg',
    updated_at = now()
WHERE name = 'Mariah Carey - Vogue - Americana 348';

-- Fix Crawford & Co Productions - McDonalds - Empty Suberbia
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/309882/conversions/Empty-Suberbia-mcDonalds012-xs.jpg',
    updated_at = now()
WHERE name = 'Crawford & Co Productions - McDonalds - Empty Suberbia';

-- Fix Lady Gaga - Elle Magazine - Hearst House
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/310242/conversions/Lady-Gaga-Mayhem-ELLE-Magazine-xs.jpg',
    updated_at = now()
WHERE name = 'Lady Gaga - Elle Magazine - Hearst House';

-- Fix Beyonce - W Magazine
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/291133/conversions/beyonc-covers-xs.jpg',
    updated_at = now()
WHERE name = 'Beyonce - W Magazine';

-- Fix Paris Hilton - Living Proof
UPDATE projects
SET banner_image = 'https://imagelocations-laravel.s3.us-west-1.amazonaws.com/media/287032/conversions/LivingProof-PH001-xs.jpg',
    updated_at = now()
WHERE name = 'Paris Hilton - Living Proof';

-- Verify all URLs are now clean
SELECT
  name,
  banner_image,
  CASE
    WHEN banner_image LIKE '%' || chr(10) || '%' THEN 'HAS NEWLINE ❌'
    ELSE 'CLEAN ✓'
  END as url_status
FROM projects
ORDER BY display_order;
