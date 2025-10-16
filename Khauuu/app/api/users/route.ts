import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get current user from authorization header
    const authHeader = request.headers.get('authorization')
    let currentUserId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const supabaseAuth = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data: { user } } = await supabaseAuth.auth.getUser(token)
      currentUserId = user?.id
    }

    // If ID is provided, fetch individual user profile
    if (id) {
      const { data: profile, error: profileError } = await supabaseServer
        .from('profiles')
        .select(`
          user_id,
          username,
          full_name,
          bio,
          profile_image_url,
          website,
          location,
          is_vegetarian,
          is_verified,
          reviews_count,
          followers_count,
          following_count,
          is_private,
          created_at
        `)
        .eq('user_id', id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ 
          error: 'Profile not found',
          details: profileError?.message 
        }, { status: 404 })
      }

      // Transform the data to match the expected format
      const user = {
        user_id: profile.user_id,
        username: profile.username.startsWith('@') ? profile.username : `@${profile.username}`,
        full_name: profile.full_name || profile.username,
        bio: profile.bio || '',
        avatar_url: profile.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username)}&background=random`,
        location: profile.location,
        website: profile.website,
        is_private: profile.is_private || false,
        followers_count: profile.followers_count || 0,
        following_count: profile.following_count || 0,
        is_verified: profile.is_verified || false,
        is_vegetarian: profile.is_vegetarian || false,
        reviews_count: profile.reviews_count || 0,
        created_at: profile.created_at
      }

      return NextResponse.json({ user })
    }

    // Build the query
    let query = supabaseServer
      .from('profiles')
      .select(`
        user_id,
        username,
        full_name,
        bio,
        profile_image_url,
        website,
        location,
        is_vegetarian,
        is_verified,
        reviews_count,
        created_at
      `)
      .order('created_at', { ascending: false })

    // Exclude current user from results
    if (currentUserId) {
      query = query.neq('user_id', currentUserId)
    }

    // Add search filter if provided
    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    // Get total count for pagination
    let countQuery = supabaseServer
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (currentUserId) {
      countQuery = countQuery.neq('user_id', currentUserId)
    }
    
    if (search.trim()) {
      countQuery = countQuery.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`)
    }
    
    const { count: totalCount } = await countQuery

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError)
      return NextResponse.json({ 
        error: 'Failed to fetch profiles',
        details: profilesError.message 
      }, { status: 500 })
    }

    // Transform the data to match the expected format
    const users = profiles.map(profile => ({
      id: profile.user_id,
      name: profile.full_name || profile.username,
      username: profile.username.startsWith('@') ? profile.username : `@${profile.username}`,
      bio: profile.bio || '',
      avatar: profile.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username)}&background=random`,
      reviews: profile.reviews_count || 0,
      verified: profile.is_verified || false,
      website: profile.website,
      location: profile.location,
      isVegetarian: profile.is_vegetarian || false,
      createdAt: profile.created_at
    }))

    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasMore: page < Math.ceil((totalCount || 0) / limit)
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}