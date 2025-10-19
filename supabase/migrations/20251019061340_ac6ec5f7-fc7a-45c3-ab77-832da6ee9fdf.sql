-- Rename title to text and make it the main content field
ALTER TABLE pins RENAME COLUMN title TO text;

-- Drop message column since we only need text now
ALTER TABLE pins DROP COLUMN IF EXISTS message;

-- Make text field longer for tweet-like content
ALTER TABLE pins ALTER COLUMN text TYPE text;