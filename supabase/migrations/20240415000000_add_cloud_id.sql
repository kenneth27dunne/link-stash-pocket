-- Add cloud_id column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS cloud_id INTEGER;

-- Add cloud_id column to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS cloud_id INTEGER;

-- Create an index on cloud_id for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_cloud_id ON categories(cloud_id);
CREATE INDEX IF NOT EXISTS idx_links_cloud_id ON links(cloud_id);

-- Add a comment to explain the purpose of the cloud_id column
COMMENT ON COLUMN categories.cloud_id IS 'The ID of the record in the cloud database';
COMMENT ON COLUMN links.cloud_id IS 'The ID of the record in the cloud database'; 