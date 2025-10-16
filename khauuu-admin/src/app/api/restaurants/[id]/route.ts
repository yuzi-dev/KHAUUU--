import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { CreateRestaurantData } from '@/types/database'

// GET /api/restaurants/[id] - Get restaurant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminClient = createSupabaseAdmin()
    const { data, error } = await adminClient
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    )
  }
}

// PUT /api/restaurants/[id] - Update restaurant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const restaurantData: Partial<CreateRestaurantData> = await request.json()
    
    const adminClient = createSupabaseAdmin()
    const { data, error } = await adminClient
      .from('restaurants')
      .update({ ...restaurantData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    )
  }
}

// DELETE /api/restaurants/[id] - Delete restaurant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminClient = createSupabaseAdmin()
    const { error } = await adminClient
      .from('restaurants')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    )
  }
}