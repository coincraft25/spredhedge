/*
  # Update Blog Categories for The Edge

  1. Changes Made
    - Remove the "Transparency" category
    - Add new categories: Bitcoin Treasury, Top Picks, Passive Income, Market Updates
    - Keep existing categories: Macro Signals, Playbook, Strategy, Positions & Performance
    
  2. New Categories Added
    - `Bitcoin Treasury` - Content about Bitcoin treasury strategies and holdings
    - `Top Picks` - Featured investment recommendations and analysis
    - `Passive Income` - Income generation strategies and opportunities
    - `Market Updates` - General market news and updates
    
  3. Categories Configuration
    Each category has a unique name, slug, and color for visual differentiation
    - Macro Signals: Blue (#3B82F6)
    - Playbook: Amber (#F59E0B)
    - Strategy: Orange (#F97316)
    - Bitcoin Treasury: Yellow (#EAB308)
    - Positions & Performance: Green (#10B981)
    - Top Picks: Violet (#8B5CF6)
    - Passive Income: Emerald (#059669)
    - Market Updates: Slate (#64748B)
*/

-- Remove the Transparency category (keeping data integrity by not deleting if posts reference it)
DELETE FROM blog_categories 
WHERE slug = 'transparency' 
AND NOT EXISTS (
  SELECT 1 FROM blog_posts WHERE 'transparency' = ANY(
    SELECT unnest(category_ids::text[])::uuid::text 
    FROM blog_categories 
    WHERE slug = 'transparency'
  )
);

-- Insert new categories if they don't already exist
INSERT INTO blog_categories (name, slug, color) VALUES
  ('Bitcoin Treasury', 'bitcoin-treasury', '#EAB308'),
  ('Top Picks', 'top-picks', '#8B5CF6'),
  ('Passive Income', 'passive-income', '#059669'),
  ('Market Updates', 'market-updates', '#64748B')
ON CONFLICT (slug) DO NOTHING;

-- Update Strategy color to distinguish it from Playbook
UPDATE blog_categories 
SET color = '#F97316' 
WHERE slug = 'strategy';
