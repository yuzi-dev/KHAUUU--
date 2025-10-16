import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value;

    if (sessionToken) {
      try {
        // Verify and decode the session token
        const decoded = jwt.verify(sessionToken, JWT_SECRET) as { adminUserId: string };
        
        const supabase = createSupabaseAdmin();

        // Delete the session from database
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', sessionToken);

        // Optionally, delete all sessions for this admin user
        // await supabase
        //   .from('admin_sessions')
        //   .delete()
        //   .eq('admin_user_id', decoded.adminUserId);

      } catch (jwtError) {
        console.error('JWT verification error during logout:', jwtError);
        // Continue with logout even if JWT verification fails
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear the session cookie
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}