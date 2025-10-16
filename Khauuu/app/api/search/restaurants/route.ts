import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Cap at 50
    const offset = (page - 1) * limit

    if (!query.trim()) {
      return NextResponse.json({ 
        error: 'Search query is required' 
      }, { status: 400 })
    }

    // Use the search_restaurants function from the database
    const { data: restaurants, error } = await supabaseServer
      .rpc('search_restaurants', {
        search_query: query.trim(),
        limit_count: limit,
        offset_count: offset
      })

    if (error) {
      console.error('Restaurant search error:', error)
      return NextResponse.json({ 
        error: 'Failed to search restaurants',
        details: error.message 
      }, { status: 500 })
    }

    // Get total count for pagination (approximate)
    const { data: countData, error: countError } = await supabaseServer
      .rpc('search_restaurants', {
        search_query: query.trim(),
        limit_count: 1000, // Large number to get approximate count
        offset_count: 0
      })

    const totalCount = countData?.length || 0
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      restaurants: restaurants || [],
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore: page < totalPages
      },
      query: query.trim()
    })

  } catch (error) {
    console.error('Restaurant search API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}