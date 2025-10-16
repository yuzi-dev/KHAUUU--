const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSharingMigration() {
  const commands = [
    // Create shared_content table
    `CREATE TABLE IF NOT EXISTS public.shared_content (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('food', 'restaurant')),
      content_id UUID NOT NULL,
      shared_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
      share_message TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
    )`,
    
    // Add sender_id to messages if not exists
    `ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE`,
    
    // Update message_type constraint
    `ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_message_type_check`,
    `ALTER TABLE public.messages ADD CONSTRAINT messages_message_type_check CHECK (message_type IN ('text', 'shared_content'))`,
    
    // Add shared_content_id to messages
    `ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS shared_content_id UUID REFERENCES public.shared_content(id) ON DELETE SET NULL`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_shared_content_type_id ON public.shared_content(content_type, content_id)`,
    `CREATE INDEX IF NOT EXISTS idx_shared_content_shared_by ON public.shared_content(shared_by)`,
    `CREATE INDEX IF NOT EXISTS idx_shared_content_created_at ON public.shared_content(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_messages_shared_content_id ON public.messages(shared_content_id)`,
    
    // Enable RLS
    `ALTER TABLE public.shared_content ENABLE ROW LEVEL SECURITY`,
    
    // Grant permissions
    `GRANT SELECT, INSERT, UPDATE ON public.shared_content TO authenticated`
  ];

  console.log('Running sharing system migration...');
  
  for (let i = 0; i < commands.length; i++) {
    try {
      console.log(`Executing command ${i + 1}/${commands.length}...`);
      
      const { data, error } = await supabase.rpc('exec', { sql: commands[i] });
      
      if (error) {
        console.error(`Command ${i + 1} failed:`, error.message);
      } else {
        console.log(`Command ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.error(`Error executing command ${i + 1}:`, err.message);
    }
  }
  
  console.log('Migration completed');
}

runSharingMigration();