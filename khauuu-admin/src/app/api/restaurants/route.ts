import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { CreateRestaurantData } from '@/types/database'

// GET /api/restaurants - Get all restaurants or search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')
    
    const adminClient = createSupabaseAdmin()
    
    let query = adminClient
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
    
    // Add search filter if provided
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching restaurants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    )
  }
}

// POST /api/restaurants - Create a new restaurant
export async function POST(request: NextRequest) {
  try {
    const restaurantData: CreateRestaurantData = await request.json()
    
    const adminClient = createSupabaseAdmin()
    const { data, error } = await adminClient
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to create restaurant' },
      { status: 500 }
    )
  }
}