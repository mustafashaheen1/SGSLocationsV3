/*
  # SmugMug OAuth Tokens Storage

  1. New Tables
    - `smugmug_tokens`
      - `id` (uuid, primary key)
      - `access_token` (text) - OAuth access token
      - `access_token_secret` (text) - OAuth access token secret
      - `created_at` (timestamptz) - When token was created
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `smugmug_tokens` table
    - Add policy for authenticated users to read tokens
    - Add policy for authenticated users to insert/update tokens

  3. Notes
    - Only stores the most recent token
    - Tokens should be rotated periodically
    - Used for OAuth 1.0a three-legged authentication
*/

CREATE TABLE IF NOT EXISTS smugmug_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  access_token_secret text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smugmug_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tokens"
  ON smugmug_tokens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tokens"
  ON smugmug_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tokens"
  ON smugmug_tokens
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tokens"
  ON smugmug_tokens
  FOR DELETE
  TO authenticated
  USING (true);
