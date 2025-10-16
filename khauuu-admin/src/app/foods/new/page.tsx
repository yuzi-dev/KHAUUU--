'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { foodApi } from '@/lib/api/foods'
import { restaurantApi } from '@/lib/api/restaurants'
import { CreateFoodData, Restaurant } from '@/types/database'
import { toast } from 'sonner'
import { DeferredImageUpload } from '@/components/ui/deferred-image-upload'
import { uploadImage } from '@/lib/cloudinary'

// Memoized constants to prevent unnecessary re-renders
const categories = [
  'Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Snack', 'Soup', 'Salad', 'Side Dish'
] as const

export default function NewFoodPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(true)
  const [formData, setFormData] = useState<CreateFoodData>({
    restaurant_id: '',
    name: '',
    description: '',
    price: 0,
    category: '',
    is_vegetarian: false,
    images: [],
    is_available: true,
    is_featured: false,
    tags: []
  })

  useEffect(() => {
    loadRestaurants()
  }, [])

  const loadRestaurants = async () => {
    try {
      setLoadingRestaurants(true)
      const data = await restaurantApi.getAll()
      setRestaurants(data.filter(r => r.is_active))
    } catch (error) {
      console.error('Error loading restaurants:', error)
      toast.error('Failed to load restaurants')
    } finally {
      setLoadingRestaurants(false)
    }
  }

  // Optimized input change handlers with useCallback
  const handleInputChange = useCallback((field: keyof CreateFoodData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleArrayChange = useCallback((field: 'tags' | 'images', value: string) => {
    if (!value.trim()) return
    
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }))
  }, [])

  const removeArrayItem = useCallback((field: 'tags' | 'images', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: any, i: number) => i !== index)
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      // Validate required fields first - before any uploads
      if (!formData.name || !formData.restaurant_id || !formData.category || formData.price <= 0) {
        toast.error('Please fill in all required fields')
        return
      }

      // Additional validation
      if (!formData.description) {
        toast.error('Please provide a description for the food item')
        return
      }

      // Prepare data for upload - only upload images after validation passes
      const uploadedData = { ...formData }
      
      // Upload food images
      if (formData.images && formData.images.length > 0) {
        try {
          const imageUrls = await Promise.all(
            formData.images.map(async (image: File | string) => {
              if (image instanceof File) {
                return await uploadImage(image, 'foods')
              }
              return image // Already uploaded URL
            })
          )
          uploadedData.images = imageUrls
        } catch (uploadError) {
          console.error('Error uploading food images:', uploadError)
          toast.error('Failed to upload food images. Please try again.')
          return
        }
      }
      
      // Only create food item after successful image uploads
      await foodApi.create(uploadedData)
      toast.success('Food item created successfully')
      router.push('/foods')
    } catch (error) {
      console.error('Error creating food:', error)
      // Better error logging
      if (error instanceof Error) {
        console.error('Error details:', error.message)
        toast.error(`Failed to create food item: ${error.message}`)
      } else {
        console.error('Unknown error:', JSON.stringify(error))
        toast.error('Failed to create food item. Please check all fields and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loadingRestaurants) {
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
            <p className="mt-2 text-gray-600">Loading restaurants...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/foods">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Food Item</h1>
          <p className="text-gray-600">Create a new food item for a restaurant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about the food item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant_id">Restaurant *</Label>
                <Select value={formData.restaurant_id} onValueChange={(value) => handleInputChange('restaurant_id', value)}>
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
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
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
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter food name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the food item..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="price">Price (NPR) *</Label>
                 <Input
                   id="price"
                   type="number"
                   min="0"
                   step="0.01"
                   value={formData.price}
                   onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                   placeholder="0.00"
                   required
                 />
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Dietary Information */}
         <Card>
           <CardHeader>
             <CardTitle>Dietary Information</CardTitle>
             <CardDescription>Specify dietary restrictions and preferences</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="is_vegetarian"
                   checked={formData.is_vegetarian}
                   onCheckedChange={(checked) => handleInputChange('is_vegetarian', checked)}
                 />
                 <Label htmlFor="is_vegetarian">Vegetarian</Label>
               </div>
               
               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="is_available"
                   checked={formData.is_available}
                   onCheckedChange={(checked) => handleInputChange('is_available', checked)}
                 />
                 <Label htmlFor="is_available">Available</Label>
               </div>

               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="is_featured"
                   checked={formData.is_featured}
                   onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                 />
                 <Label htmlFor="is_featured">Featured</Label>
               </div>
             </div>
           </CardContent>
         </Card>

        {/* Additional Information */}
         <Card>
           <CardHeader>
             <CardTitle>Additional Information</CardTitle>
             <CardDescription>Images and tags for the food item</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             {/* Food Images */}
             <DeferredImageUpload
               label="Food Images"
               value={formData.images || []}
               onChange={(files) => handleInputChange('images', files)}
               maxImages={5}
             />

             {/* Tags */}
             <div className="space-y-2">
               <Label>Tags</Label>
               <div className="flex flex-wrap gap-2 mb-2">
                 {(formData.tags || []).map((tag: string, index: number) => (
                   <span
                     key={index}
                     className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm cursor-pointer"
                     onClick={() => removeArrayItem('tags', index)}
                   >
                     {tag} ×
                   </span>
                 ))}
               </div>
               <Input
                 placeholder="Add tag (press Enter)"
                 onKeyPress={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault()
                     handleArrayChange('tags', e.currentTarget.value)
                     e.currentTarget.value = ''
                   }
                 }}
               />
             </div>
           </CardContent>
         </Card>

         {/* Food Settings */}
         <Card>
           <CardHeader>
             <CardTitle>Food Settings</CardTitle>
             <CardDescription>Configure food availability and dietary information</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="is_vegetarian"
                   checked={formData.is_vegetarian}
                   onCheckedChange={(checked) => handleInputChange('is_vegetarian', checked)}
                 />
                 <Label htmlFor="is_vegetarian">Vegetarian</Label>
               </div>
               
               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="is_available"
                   checked={formData.is_available}
                   onCheckedChange={(checked) => handleInputChange('is_available', checked)}
                 />
                 <Label htmlFor="is_available">Available</Label>
               </div>

               <div className="flex items-center space-x-2">
                 <Checkbox
                   id="is_featured"
                   checked={formData.is_featured}
                   onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                 />
                 <Label htmlFor="is_featured">Featured</Label>
               </div>
             </div>
           </CardContent>
         </Card>
          
        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Link href="/foods">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Food Item
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}