import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Profile Creation API Called ===');
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Missing or invalid authorization header');
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    console.log('Token extracted, length:', token.length);
    
    console.log('Verifying token with Supabase...');
    // Verify the JWT token using server client
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(token);
    
    console.log('User verification result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      error: userError?.message
    });
    
    if (userError || !user) {
      console.error('User verification error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if profile already exists
    console.log('Checking if profile exists...');
    const { data: existingProfile, error: profileCheckError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileCheckError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingProfile) {
      console.log('Profile already exists:', existingProfile.username);
      return NextResponse.json({ 
        message: 'Profile already exists', 
        profile: existingProfile 
      }, { status: 200 });
    }

    // Generate unique username
    console.log('Generating username...');
    const emailUsername = user.email!.split('@')[0];
    let username = emailUsername
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);

    if (username.length < 3) {
      username = user.id.substring(0, 8);
    }

    // Check if username is unique
    let finalUsername = username;
    let counter = 1;
    
    while (true) {
      const { data: existingUser } = await supabaseServer
        .from('profiles')
        .select('username')
        .eq('username', finalUsername)
        .single();

      if (!existingUser) {
        break;
      }

      finalUsername = `${username}${counter}`;
      counter++;
    }

    console.log('Final username:', finalUsername);

    // Create the profile
    console.log('Creating profile in database...');
    const { data: newProfile, error: insertError } = await supabaseServer
      .from('profiles')
      .insert({
        user_id: user.id,
        username: finalUsername,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split('@')[0],
        bio: null,
        profile_image_url: user.user_metadata?.avatar_url || null,
        website: null,
        location: null,
        is_vegetarian: false,
        is_verified: false,
        reviews_public: true,
        saved_public: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Profile creation error:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create profile',
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('✅ Profile created successfully:', newProfile.username);
    return NextResponse.json({ 
      message: 'Profile created successfully', 
      profile: newProfile 
    }, { status: 201 });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}