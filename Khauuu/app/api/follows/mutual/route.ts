import { supabaseServer } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 })
    }

    // Use the database function to get mutual follows
    const { data, error } = await supabase
      .rpc('get_mutual_follows', { user_id })

    if (error) {
      console.error('Get mutual follows error:', error)
      return NextResponse.json({ error: 'Failed to fetch mutual follows' }, { status: 500 })
    }

    // Get profile details for mutual follows
    if (data && data.length > 0) {
      const mutualUserIds = data.map((item: any) => item.mutual_user_id)
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, profile_image_url, bio')
        .in('user_id', mutualUserIds)

      if (profilesError) {
        console.error('Get mutual profiles error:', profilesError)
        return NextResponse.json({ error: 'Failed to fetch mutual profiles' }, { status: 500 })
      }

      return NextResponse.json({
        mutual_follows: profiles || [],
        count: profiles?.length || 0
      })
    }

    return NextResponse.json({
      mutual_follows: [],
      count: 0
    })

  } catch (error) {
    console.error('Mutual follows API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}