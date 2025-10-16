import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { CreateFoodData } from '@/types/database'

// GET /api/foods - Get all foods or search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')
    const restaurantId = searchParams.get('restaurant_id')
    
    const adminClient = createSupabaseAdmin()
    
    let query = adminClient
      .from('foods')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Add restaurant filter if provided
    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId)
    }
    
    // Add search filter if provided
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching foods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch foods' },
      { status: 500 }
    )
  }
}

// POST /api/foods - Create a new food
export async function POST(request: NextRequest) {
  try {
    const foodData: CreateFoodData = await request.json()
    
    const adminClient = createSupabaseAdmin()
    const { data, error } = await adminClient
      .from('foods')
      .insert([foodData])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating food:', error)
    return NextResponse.json(
      { error: 'Failed to create food' },
      { status: 500 }
    )
  }
}