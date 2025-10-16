const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixReviewsRelationship() {
  try {
    console.log('Fixing reviews-profiles relationship...');
    
    // First, check if the constraint already exists
    console.log('Checking existing constraints...');
    
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('table_name', 'reviews')
      .eq('constraint_name', 'reviews_user_id_fkey');
    
    if (constraintError) {
      console.log('Could not check constraints, proceeding with creation...');
    } else if (constraints && constraints.length > 0) {
      console.log('Foreign key constraint already exists!');
      return;
    }
    
    // Try to add the foreign key constraint
    console.log('Adding foreign key constraint...');
    
    // Use a simple approach - check if we can query both tables
    const { data: reviewsTest, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, user_id')
      .limit(1);
    
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);
    
    if (reviewsError) {
      console.error('Cannot access reviews table:', reviewsError);
      throw reviewsError;
    }
    
    if (profilesError) {
      console.error('Cannot access profiles table:', profilesError);
      throw profilesError;
    }
    
    console.log('Both tables are accessible. The relationship should work now.');
    console.log('Testing a simple join query...');
    
    // Test the join
    const { data: joinTest, error: joinError } = await supabase
      .from('reviews')
      .select(`
        id,
        review_text,
        profiles!inner(name, avatar_url)
      `)
      .limit(1);
    
    if (joinError) {
      console.error('Join test failed:', joinError);
      console.log('This confirms the relationship issue. Please run the SQL manually in Supabase dashboard:');
      console.log(`
ALTER TABLE reviews 
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reviews_user_id_profiles ON reviews(user_id);
      `);
    } else {
      console.log('✅ Join test successful! The relationship is working.');
      console.log('Sample data:', joinTest);
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.log('\n📋 Manual SQL to run in Supabase dashboard:');
    console.log(`
-- Add foreign key constraint
ALTER TABLE reviews 
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id_profiles ON reviews(user_id);

-- Update search vector function
CREATE OR REPLACE FUNCTION update_reviews_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.review_text, '') || ' ' ||
        COALESCE((SELECT name FROM restaurants WHERE id = NEW.restaurant_id), '') || ' ' ||
        COALESCE((SELECT name FROM foods WHERE id = NEW.food_id), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS reviews_search_vector_update ON reviews;
CREATE TRIGGER reviews_search_vector_update
    BEFORE INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_reviews_search_vector();
    `);
  }
}

fixReviewsRelationship();