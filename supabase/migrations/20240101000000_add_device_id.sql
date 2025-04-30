-- Add device_id column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add device_id column to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Create an index on device_id for faster queries
CREATE INDEX IF NOT EXISTS idx_categories_device_id ON categories(device_id);
CREATE INDEX IF NOT EXISTS idx_links_device_id ON links(device_id);

-- Add a comment to explain the purpose of the device_id column
COMMENT ON COLUMN categories.device_id IS 'Identifies which device created or last modified this record';
COMMENT ON COLUMN links.device_id IS 'Identifies which device created or last modified this record'; 