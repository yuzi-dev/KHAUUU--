import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError) {
      // PGRST116 means no profile found - this is expected for new users
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'Profile not found', 
          code: 'PROFILE_NOT_FOUND',
          message: 'No profile exists for this user'
        }, { status: 404 })
      }
      
      // Other errors are actual problems
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch profile',
        details: profileError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, profileData } = body

    console.log('PUT request received:', { userId, profileData })

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!profileData) {
      return NextResponse.json({ error: 'Profile data is required' }, { status: 400 })
    }

    // First check if profile exists
    const { data: existingProfile, error: selectError } = await supabaseServer
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('Existing profile check:', { existingProfile, selectError })

    if (selectError || !existingProfile) {
      console.log('Profile not found for user:', userId)
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Update profile with privacy settings
    console.log('About to update profile with ID:', existingProfile.id)
    console.log('Profile data to update:', profileData)
    
    const { data: updatedProfile, error: updateError } = await supabaseServer
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProfile.id)  // Use the profile ID instead of user_id
      .select()

    console.log('Update result:', { updatedProfile, updateError })

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: updateError.message 
      }, { status: 500 })
    }

    // Check if any rows were updated
    if (!updatedProfile || updatedProfile.length === 0) {
      console.log('No rows were updated - profile might not exist')
      return NextResponse.json(
        { error: 'Profile not found or no changes made' },
        { status: 404 }
      )
    }

    const response = { 
      profile: updatedProfile[0],
      message: 'Profile updated successfully'
    }
    
    console.log('Sending response:', response)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}