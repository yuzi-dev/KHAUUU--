'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { foodApi } from '@/lib/api/foods'
import { restaurantApi } from '@/lib/api/restaurants'
import { Food, Restaurant, CreateFoodData } from '@/types/database'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/ui/image-upload'

export default function EditFoodPage() {
  const params = useParams()
  const router = useRouter()
  const [food, setFood] = useState<Food | null>(null)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateFoodData>({
    restaurant_id: '',
    name: '',
    description: '',
    category: '',
    price: 0,
    is_vegetarian: false,
    is_available: true,
    tags: [],
    images: []
  })

  useEffect(() => {
    if (params.id) {
      loadData(params.id as string)
    }
  }, [params.id])

  const loadData = async (id: string) => {
    try {
      setLoading(true)
      const [foodData, restaurantsData] = await Promise.all([
        foodApi.getById(id),
        restaurantApi.getAll()
      ])
      
      setFood(foodData)
      setRestaurants(restaurantsData)
      
      // Populate form with existing data
      if (foodData) {
        setFormData({
          restaurant_id: foodData.restaurant_id,
          name: foodData.name,
          description: foodData.description || '',
          category: foodData.category,
          price: foodData.price,
          is_vegetarian: foodData.is_vegetarian,
          is_available: foodData.is_available,
          is_featured: foodData.is_featured || false,
          tags: foodData.tags || [],
          images: foodData.images || []
        })
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load food data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!food) return

    try {
      setSubmitting(true)
      await foodApi.update(food.id, formData)
      toast.success('Food item updated successfully')
      router.push(`/foods/${food.id}`)
    } catch (error) {
      console.error('Error updating food:', error)
      toast.error('Failed to update food item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    setFormData(prev => ({ ...prev, tags }))
  }

  const handleImagesChange = (value: string) => {
    const images = value.split('\n').map(url => url.trim()).filter(url => url.length > 0)
    setFormData(prev => ({ ...prev, images }))
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
            <p className="mt-2 text-gray-600">Loading food data...</p>
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
            <p className="text-gray-500">The food item you're trying to edit doesn't exist.</p>
            <Link href="/foods">
              <Button className="mt-4">Back to Food Items</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const foodCategories = [
    'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad', 'Soup', 
    'Sandwich', 'Pizza', 'Pasta', 'Seafood', 'Meat', 'Vegetarian', 'Snack'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href={`/foods/${food.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Food Item</h1>
          <p className="text-gray-600">Update food information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Update the basic details of the food item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant">Restaurant *</Label>
                    <Select
                      value={formData.restaurant_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, restaurant_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {foodCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Food Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter food name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the food item..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-2">
                  <Label>Food Images</Label>
                  <ImageUpload
                    label="Food Images"
                    value={formData.images || []}
                    onChange={(images: string[]) => setFormData(prev => ({ ...prev, images }))}
                    maxImages={5}
                    folder="foods"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dietary Information */}
            <Card>
              <CardHeader>
                <CardTitle>Dietary Information</CardTitle>
                <CardDescription>
                  Specify dietary restrictions and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vegetarian"
                      checked={formData.is_vegetarian}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_vegetarian: checked as boolean }))
                      }
                    />
                    <Label htmlFor="vegetarian">Vegetarian</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="available"
                      checked={formData.is_available}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_available: checked as boolean }))
                      }
                    />
                    <Label htmlFor="available">Available</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_featured: checked as boolean }))
                      }
                    />
                    <Label htmlFor="featured">Featured</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>
                  Tags and images for the food item
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="spicy, popular, chef-special (comma separated)"
                  />
                  <p className="text-sm text-gray-500">
                    Separate tags with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Image URLs</Label>
                  <Textarea
                    id="images"
                    value={formData.images.join('\n')}
                    onChange={(e) => handleImagesChange(e.target.value)}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500">
                    One URL per line
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Food Info */}
            <Card>
              <CardHeader>
                <CardTitle>Current Food</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-semibold">{food.name}</p>
                  <p className="text-sm text-gray-600">{food.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price: ${food.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating: {food.rating.toFixed(1)}/5</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Food Item
                    </>
                  )}
                </Button>
                <Link href={`/foods/${food.id}`}>
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}