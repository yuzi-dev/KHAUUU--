import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(sessionToken, JWT_SECRET) as { adminUserId: string };
    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const supabase = createSupabaseAdmin();

    // Check if session exists in database and is not expired
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('admin_user_id', decoded.adminUserId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session expired or invalid' },
        { status: 401 }
      );
    }

    // Get admin user details
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('id, username, email, full_name, role, is_active, last_login, created_at')
      .eq('id', decoded.adminUserId)
      .eq('is_active', true)
      .single();

    if (userError || !adminUser) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: adminUser,
      session: {
        id: session.id,
        expires_at: session.expires_at,
      }
    });
  } catch (error) {
    console.error('Admin session verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}