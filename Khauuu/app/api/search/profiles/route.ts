import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Cap at 50
    const offset = (page - 1) * limit
    const verifiedOnly = searchParams.get('verified_only') === 'true'

    if (!query.trim()) {
      return NextResponse.json({ 
        error: 'Search query is required' 
      }, { status: 400 })
    }

    // Get current user from authorization header (optional for search)
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

    // Use the search_profiles function from the database
    const { data: profiles, error } = await supabaseServer
      .rpc('search_profiles', {
        search_query: query.trim(),
        limit_count: limit,
        offset_count: offset,
        verified_filter: verifiedOnly
      })

    if (error) {
      console.error('Profile search error:', error)
      return NextResponse.json({ 
        error: 'Failed to search profiles',
        details: error.message 
      }, { status: 500 })
    }

    // Filter out current user from results if authenticated
    let filteredProfiles = profiles || []
    if (currentUserId) {
      filteredProfiles = filteredProfiles.filter((profile: any) => profile.user_id !== currentUserId)
    }

    // Get total count for pagination (approximate)
    const { data: countData, error: countError } = await supabaseServer
      .rpc('search_profiles', {
        search_query: query.trim(),
        limit_count: 1000, // Large number to get approximate count
        offset_count: 0,
        verified_filter: verifiedOnly
      })

    let totalCount = countData?.length || 0
    if (currentUserId && countData) {
      // Adjust count to exclude current user
      totalCount = countData.filter((profile: any) => profile.user_id !== currentUserId).length
    }
    
    const totalPages = Math.ceil(totalCount / limit)

    // Transform the data to match expected format
    const transformedProfiles = filteredProfiles.map((profile: any) => ({
      id: profile.user_id,
      name: profile.full_name || profile.username,
      username: profile.username.startsWith('@') ? profile.username : `@${profile.username}`,
      bio: profile.bio || '',
      avatar: profile.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.username)}&background=random`,
      verified: profile.is_verified || false,
      website: profile.website,
      location: profile.location,
      isVegetarian: profile.is_vegetarian || false,
      createdAt: profile.created_at,
      rank: profile.rank // Search relevance rank
    }))

    return NextResponse.json({
      success: true,
      profiles: transformedProfiles,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages
      },
      query: query.trim(),
      filters: {
        verified_only: verifiedOnly
      }
    })

  } catch (error) {
    console.error('Profile search API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}