'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, Trash2, Star, DollarSign } from 'lucide-react'
import { foodApi } from '@/lib/api/foods'
import { restaurantApi } from '@/lib/api/restaurants'
import { Food, Restaurant } from '@/types/database'
import { formatPrice, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function FoodDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [food, setFood] = useState<Food | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadFood(params.id as string)
    }
  }, [params.id])

  const loadFood = async (id: string) => {
    try {
      setLoading(true)
      const foodData = await foodApi.getById(id)
      setFood(foodData)
      
      // Load restaurant data
      if (foodData) {
        const restaurantData = await restaurantApi.getById(foodData.restaurant_id)
        setRestaurant(restaurantData)
      }
    } catch (error) {
      console.error('Error loading food:', error)
      toast.error('Failed to load food details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!food) return
    
    if (!confirm(`Are you sure you want to delete "${food.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await foodApi.delete(food.id)
      toast.success('Food item deleted successfully')
      router.push('/foods')
    } catch (error) {
      console.error('Error deleting food:', error)
      toast.error('Failed to delete food item')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/foods">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading food details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!food) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/foods">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Food Item Not Found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">The food item you're looking for doesn't exist.</p>
            <Link href="/foods">
              <Button className="mt-4">Back to Food Items</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/foods">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{food.name}</h1>
            <p className="text-gray-600">
              {restaurant?.name} • {food.category}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/foods/${food.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Food Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {food.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{food.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Category</h4>
                  <Badge variant="secondary">{food.category}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Price</h4>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-lg font-bold text-green-600">{formatPrice(food.price)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <Badge variant={food.is_available ? "default" : "secondary"}>
                  {food.is_available ? "Available" : "Unavailable"}
                </Badge>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Dietary Information</h4>
                <div className="flex flex-wrap gap-2">
                  {food.is_vegetarian && (
                    <Badge variant="outline" className="text-green-600">Vegetarian</Badge>
                  )}
                  {food.is_featured && (
                    <Badge variant="outline" className="text-yellow-600">Featured</Badge>
                  )}
                  {!food.is_vegetarian && !food.is_featured && (
                    <span className="text-gray-500 text-sm">No dietary restrictions specified</span>
                  )}
                </div>
              </div>

              {food.tags && food.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {food.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Restaurant Information */}
          {restaurant && (
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Restaurant</h4>
                  <Link 
                    href={`/restaurants/${restaurant.id}`}
                    className="text-blue-600 hover:underline text-lg font-medium"
                  >
                    {restaurant.name}
                  </Link>
                  <p className="text-gray-600">{restaurant.cuisine} • {restaurant.location_name}</p>
                </div>
                
                {restaurant.description && (
                  <div>
                    <h4 className="font-semibold mb-2">About Restaurant</h4>
                    <p className="text-gray-700">{restaurant.description}</p>
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{restaurant.rating.toFixed(1)} ({restaurant.review_count} reviews)</span>
                  </div>
                  <Badge variant="outline">{restaurant.price_range}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {food.images && food.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {food.images.map((image: string, index: number) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`${food.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-food.jpg'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-semibold">{food.rating.toFixed(1)} / 5.0</p>
                  <p className="text-sm text-gray-500">{food.review_count} reviews</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="font-semibold">Added On</p>
                <p className="text-sm text-gray-600">{formatDate(food.created_at)}</p>
              </div>

              <div>
                <p className="font-semibold">Last Updated</p>
                <p className="text-sm text-gray-600">{formatDate(food.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/foods/${food.id}/edit`}>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Food Item
                </Button>
              </Link>
              {restaurant && (
                <Link href={`/restaurants/${restaurant.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    View Restaurant
                  </Button>
                </Link>
              )}
              <Link href={`/foods?restaurant=${food.restaurant_id}`}>
                <Button variant="outline" className="w-full justify-start">
                  View Restaurant Menu
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}