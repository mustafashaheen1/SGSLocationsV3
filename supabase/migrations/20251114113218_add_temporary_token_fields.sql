/*
  # Add Temporary Token Storage Fields

  1. Changes
    - Add `request_token` field for temporary OAuth request token
    - Add `request_token_secret` field for temporary token secret
    - Add `is_temporary` boolean flag to distinguish temporary vs permanent tokens

  2. Notes
    - Temporary tokens are used during OAuth flow
    - Deleted after access token is obtained
    - Allows callback to retrieve request token secret
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'smugmug_tokens' AND column_name = 'request_token'
  ) THEN
    ALTER TABLE smugmug_tokens ADD COLUMN request_token text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'smugmug_tokens' AND column_name = 'request_token_secret'
  ) THEN
    ALTER TABLE smugmug_tokens ADD COLUMN request_token_secret text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'smugmug_tokens' AND column_name = 'is_temporary'
  ) THEN
    ALTER TABLE smugmug_tokens ADD COLUMN is_temporary boolean DEFAULT false;
  END IF;
END $$;
