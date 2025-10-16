import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Query the saved_items table directly (as per the migration schema)
    const { data: savedItems, error } = await supabaseServer
      .from('saved_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Saved items fetch error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch saved items', 
        details: error.message 
      }, { status: 500 })
    }

    // Get unique restaurant and food IDs
    const restaurantIds = [...new Set(savedItems
      .filter(item => item.item_type === 'restaurant' && item.restaurant_id)
      .map(item => item.restaurant_id))]
    
    const foodIds = [...new Set(savedItems
      .filter(item => item.item_type === 'food' && item.food_id)
      .map(item => item.food_id))]

    // Fetch restaurant data
    let restaurantsData: any[] = []
    if (restaurantIds.length > 0) {
      const { data: restaurants } = await supabaseServer
        .from('restaurants')
        .select('id, name, cover_images, cuisine, rating, address')
        .in('id', restaurantIds)
      restaurantsData = restaurants || []
    }

    // Fetch food data with restaurant info
    let foodsData: any[] = []
    if (foodIds.length > 0) {
      const { data: foods } = await supabaseServer
        .from('foods')
        .select(`
          id, name, images, price, description,
          restaurants:restaurant_id (
            id, name
          )
        `)
        .in('id', foodIds)
      foodsData = foods || []
    }

    // Create lookup maps
    const restaurantMap = new Map(restaurantsData.map(r => [r.id, r]))
    const foodMap = new Map(foodsData.map(f => [f.id, f]))

    // Format saved restaurants with real data
    const savedRestaurants = savedItems
      .filter(item => item.item_type === 'restaurant')
      .map(item => {
        const restaurant = restaurantMap.get(item.restaurant_id)
        return {
          id: item.id,
          created_at: item.created_at,
          restaurant_id: item.restaurant_id,
          collection_name: item.collection_name,
          notes: item.notes,
          restaurants: restaurant ? {
            id: restaurant.id,
            name: restaurant.name,
            image_url: restaurant.cover_images?.[0] || restaurant.images?.[0],
            cuisine_type: restaurant.cuisine,
            rating: restaurant.rating,
            location: restaurant.address
          } : null
        }
      })
      .filter(item => item.restaurants) // Only include items with valid restaurant data

    // Format saved foods with real data
    const savedFoods = savedItems
      .filter(item => item.item_type === 'food')
      .map(item => {
        const food = foodMap.get(item.food_id)
        return {
          id: item.id,
          created_at: item.created_at,
          food_id: item.food_id,
          collection_name: item.collection_name,
          notes: item.notes,
          foods: food ? {
            id: food.id,
            name: food.name,
            image_url: Array.isArray(food.images) ? food.images[0] : food.images,
            price: food.price,
            description: food.description,
            restaurants: food.restaurants
          } : null
        }
      })
      .filter(item => item.foods) // Only include items with valid food data

    return NextResponse.json({ 
      savedRestaurants, 
      savedFoods 
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, itemId, itemType } = body

    if (!userId || !itemId || !itemType) {
      return NextResponse.json({ error: 'User ID, item ID, and item type are required' }, { status: 400 })
    }

    if (itemType === 'restaurant') {
      const { data, error } = await supabaseServer
        .from('saved_restaurants')
        .insert({ user_id: userId, restaurant_id: itemId })
        .select()

      if (error) {
        console.error('Save restaurant error:', error)
        return NextResponse.json({ error: 'Failed to save restaurant' }, { status: 500 })
      }

      return NextResponse.json({ saved: data })
    } else if (itemType === 'food') {
      const { data, error } = await supabaseServer
        .from('saved_foods')
        .insert({ user_id: userId, food_id: itemId })
        .select()

      if (error) {
        console.error('Save food error:', error)
        return NextResponse.json({ error: 'Failed to save food' }, { status: 500 })
      }

      return NextResponse.json({ saved: data })
    } else {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const itemId = searchParams.get('itemId')
    const itemType = searchParams.get('itemType')

    if (!userId || !itemId || !itemType) {
      return NextResponse.json({ error: 'User ID, item ID, and item type are required' }, { status: 400 })
    }

    if (itemType === 'restaurant') {
      const { error } = await supabaseServer
        .from('saved_restaurants')
        .delete()
        .eq('user_id', userId)
        .eq('restaurant_id', itemId)

      if (error) {
        console.error('Delete saved restaurant error:', error)
        return NextResponse.json({ error: 'Failed to remove saved restaurant' }, { status: 500 })
      }
    } else if (itemType === 'food') {
      const { error } = await supabaseServer
        .from('saved_foods')
        .delete()
        .eq('user_id', userId)
        .eq('food_id', itemId)

      if (error) {
        console.error('Delete saved food error:', error)
        return NextResponse.json({ error: 'Failed to remove saved food' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}