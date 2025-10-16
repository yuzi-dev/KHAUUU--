'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, Trash2, MapPin, Phone, Mail, Globe, Star, Clock } from 'lucide-react'
import { restaurantApi } from '@/lib/api/restaurants'
import { Restaurant } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function RestaurantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadRestaurant(params.id as string)
    }
  }, [params.id])

  const loadRestaurant = async (id: string) => {
    try {
      setLoading(true)
      const data = await restaurantApi.getById(id)
      setRestaurant(data)
    } catch (error) {
      console.error('Error loading restaurant:', error)
      toast.error('Failed to load restaurant details')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!restaurant) return
    
    if (!confirm(`Are you sure you want to delete "${restaurant.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await restaurantApi.delete(restaurant.id)
      toast.success('Restaurant deleted successfully')
      router.push('/restaurants')
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      toast.error('Failed to delete restaurant')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/restaurants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading restaurant details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/restaurants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Restaurant Not Found</h1>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">The restaurant you're looking for doesn't exist.</p>
            <Link href="/restaurants">
              <Button className="mt-4">Back to Restaurants</Button>
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
          <Link href="/restaurants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-gray-600">{restaurant.cuisine} Restaurant</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/restaurants/${restaurant.id}/edit`}>
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
              <CardTitle>Restaurant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {restaurant.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{restaurant.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Cuisine Type</h4>
                  <Badge variant="secondary">{restaurant.cuisine}</Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Price Range</h4>
                  <Badge variant="outline">{restaurant.price_range}</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Status</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={restaurant.is_active ? "default" : "secondary"}>
                    {restaurant.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {restaurant.is_verified && (
                    <Badge variant="outline">Verified</Badge>
                  )}
                  {restaurant.is_featured && (
                    <Badge variant="outline">Featured</Badge>
                  )}
                </div>
              </div>

              {/* Services section removed as these properties don't exist in the Restaurant type */}

              {restaurant.features && restaurant.features.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="outline">{feature}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {restaurant.tags && restaurant.tags.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Address</h4>
                  <p className="text-gray-700">{restaurant.address}</p>
                  {restaurant.location_name && (
                    <p className="text-sm text-gray-500">{restaurant.location_name}</p>
                  )}
                </div>
              </div>

              {restaurant.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <h4 className="font-semibold">Phone</h4>
                    <p className="text-gray-700">{restaurant.phone}</p>
                  </div>
                </div>
              )}

              {restaurant.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <h4 className="font-semibold">Email</h4>
                    <p className="text-gray-700">{restaurant.email}</p>
                  </div>
                </div>
              )}

              {restaurant.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-gray-500" />
                  <div>
                    <h4 className="font-semibold">Website</h4>
                    <a 
                      href={restaurant.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {restaurant.website}
                    </a>
                  </div>
                </div>
              )}

              {(restaurant.latitude !== 0 || restaurant.longitude !== 0) && (
                <div>
                  <h4 className="font-semibold mb-2">Coordinates</h4>
                  <p className="text-gray-700">
                    Lat: {restaurant.latitude}, Lng: {restaurant.longitude}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
                  <p className="font-semibold">{restaurant.rating.toFixed(1)} / 5.0</p>
                  <p className="text-sm text-gray-500">{restaurant.review_count} reviews</p>
                </div>
              </div>

              <Separator />

              {/* Order count removed as this property doesn't exist in the Restaurant type */}

              <Separator />

              <div>
                <p className="font-semibold">Member Since</p>
                <p className="text-sm text-gray-600">{formatDate(restaurant.created_at)}</p>
              </div>

              <div>
                <p className="font-semibold">Last Updated</p>
                <p className="text-sm text-gray-600">{formatDate(restaurant.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/foods?restaurant=${restaurant.id}`}>
                <Button variant="outline" className="w-full justify-start">
                  View Menu Items
                </Button>
              </Link>
              <Link href={`/restaurants/${restaurant.id}/edit`}>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Restaurant
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}