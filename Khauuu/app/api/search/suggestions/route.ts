import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20) // Cap at 20 for suggestions

    if (!query.trim() || query.trim().length < 2) {
      return NextResponse.json({ 
        suggestions: [] 
      })
    }

    // Use the get_search_suggestions function from the database
    const { data: suggestions, error } = await supabaseServer
      .rpc('get_search_suggestions', {
        partial_query: query.trim(),
        suggestion_limit: limit
      })

    if (error) {
      console.error('Search suggestions error:', error)
      return NextResponse.json({ 
        error: 'Failed to get search suggestions',
        details: error.message 
      }, { status: 500 })
    }

    // Transform suggestions to a consistent format
    const transformedSuggestions = (suggestions || []).map((suggestion: any) => ({
      text: suggestion.suggestion,
      type: suggestion.suggestion_type,
      category: suggestion.category || null,
      count: suggestion.match_count || 0
    }))

    return NextResponse.json({
      success: true,
      query: query.trim(),
      suggestions: transformedSuggestions
    })

  } catch (error) {
    console.error('Search suggestions API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}