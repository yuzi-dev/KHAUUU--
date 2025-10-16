import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'
import type { CreateFoodData } from '@/types/database'

// GET /api/foods/[id] - Get food by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminClient = createSupabaseAdmin()
    const { data, error } = await adminClient
      .from('foods')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching food:', error)
    return NextResponse.json(
      { error: 'Failed to fetch food' },
      { status: 500 }
    )
  }
}

// PUT /api/foods/[id] - Update food
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const foodData: Partial<CreateFoodData> = await request.json()
    
    const adminClient = createSupabaseAdmin()
    const { data, error } = await adminClient
      .from('foods')
      .update(foodData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating food:', error)
    return NextResponse.json(
      { error: 'Failed to update food' },
      { status: 500 }
    )
  }
}

// DELETE /api/foods/[id] - Delete food
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const adminClient = createSupabaseAdmin()
    const { error } = await adminClient
      .from('foods')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting food:', error)
    return NextResponse.json(
      { error: 'Failed to delete food' },
      { status: 500 }
    )
  }
}