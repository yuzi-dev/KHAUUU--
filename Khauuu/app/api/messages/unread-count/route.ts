import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get user from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    let userId: string | null = null;

    if (token) {
      // Verify the token using service role client
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    } else {
      // Try cookie-based authentication
      const cookieStore = request.cookies;
      const accessToken = cookieStore.get('sb-access-token')?.value;
      const refreshToken = cookieStore.get('sb-refresh-token')?.value;

      if (!accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = user.id;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total unread message count using the database function
    const { data, error } = await supabase.rpc('get_unread_message_count', {
      p_user_id: userId
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
    }

    return NextResponse.json({ 
      unreadCount: data || 0 
    });

  } catch (error) {
    console.error('Error in unread-count API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}