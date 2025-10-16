import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100) // Cap at 100 for global search

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

    // Use the global_search function from the database
    const { data: results, error } = await supabaseServer
      .rpc('global_search', {
        search_query: query.trim(),
        result_limit: limit
      })

    if (error) {
      console.error('Global search error:', error)
      return NextResponse.json({ 
        error: 'Failed to perform global search',
        details: error.message 
      }, { status: 500 })
    }

    // Group results by type and filter out current user from profiles
    const groupedResults: {
      restaurants: any[]
      foods: any[]
      profiles: any[]
    } = {
      restaurants: [],
      foods: [],
      profiles: []
    }

    if (results) {
      results.forEach((result: any) => {
        // Skip current user in profile results
        if (result.result_type === 'profile' && currentUserId && result.id === currentUserId) {
          return
        }

        switch (result.result_type) {
          case 'restaurant':
            groupedResults.restaurants.push({
              id: result.id,
              name: result.name,
              description: result.description,
              cuisine_type: result.cuisine_type,
              address: result.address,
              rating: result.rating,
              image_url: result.image_url,
              rank: result.rank,
              type: 'restaurant'
            })
            break
          
          case 'food':
            groupedResults.foods.push({
              id: result.id,
              name: result.name,
              description: result.description,
              category: result.category,
              price: result.price,
              restaurant_name: result.restaurant_name,
              restaurant_id: result.restaurant_id,
              image_url: result.image_url,
              rank: result.rank,
              type: 'food'
            })
            break
          
          case 'profile':
            groupedResults.profiles.push({
              id: result.id,
              username: result.username?.startsWith('@') ? result.username : `@${result.username}`,
              full_name: result.full_name,
              bio: result.bio,
              profile_image_url: result.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(result.full_name || result.username)}&background=random`,
              is_verified: result.is_verified,
              rank: result.rank,
              type: 'profile'
            })
            break
        }
      })
    }

    // Calculate totals
    const totalResults = groupedResults.restaurants.length + 
                        groupedResults.foods.length + 
                        groupedResults.profiles.length

    return NextResponse.json({
      success: true,
      query: query.trim(),
      results: groupedResults,
      summary: {
        total: totalResults,
        restaurants: groupedResults.restaurants.length,
        foods: groupedResults.foods.length,
        profiles: groupedResults.profiles.length
      },
      limit
    })

  } catch (error) {
    console.error('Global search API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}