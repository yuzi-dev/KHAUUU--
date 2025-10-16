import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

// GET /api/users/search - Search for users by name or username
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer;
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters long' 
      }, { status: 400 });
    }

    // Search for users by username or full_name
    const { data: users, error: searchError } = await supabase
      .from('profiles')
      .select('user_id, username, full_name, profile_image_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq('user_id', user.id) // Exclude current user
      .limit(limit);

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json({ 
        error: 'Failed to search users' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      users: users || [],
      query,
      count: users?.length || 0
    });

  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}