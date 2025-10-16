'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import { restaurantApi } from '@/lib/api/restaurants'
import { Restaurant } from '@/types/database'
import { toast } from 'sonner'
import { ImageUpload } from '@/components/ui/image-upload'
import { CategorizedImageUpload } from '@/components/ui/categorized-image-upload'
import { TimePicker } from '@/components/ui/time-picker'
import { MenuManagement } from '@/components/ui/menu-management'

const cuisineTypes = [
  'Nepali', 'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 
  'Thai', 'Japanese', 'Korean', 'American', 'Mediterranean', 'Fast Food'
]

const priceRanges = [
  { value: '$', label: '$ - Budget (Under Rs. 500)' },
  { value: '$$', label: '$$ - Moderate (Rs. 500-1000)' },
  { value: '$$$', label: '$$$ - Expensive (Rs. 1000-2000)' },
  { value: '$$$$', label: '$$$$ - Very Expensive (Above Rs. 2000)' }
]

export default function EditRestaurantPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formData, setFormData] = useState<Restaurant | null>(null)

  useEffect(() => {
    if (params.id) {
      loadRestaurant(params.id as string)
    }
  }, [params.id])

  const loadRestaurant = async (id: string) => {
    try {
      setInitialLoading(true)
      const data = await restaurantApi.getById(id)
      setFormData(data)
    } catch (error) {
      console.error('Error loading restaurant:', error)
      toast.error('Failed to load restaurant details')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleInputChange = useCallback((field: keyof Restaurant, value: any) => {
    if (!formData) return
    
    setFormData(prev => ({
      ...prev!,
      [field]: value
    }))
  }, [formData])

  const handleArrayChange = (field: 'features' | 'tags' | 'images', value: string) => {
    if (!value.trim() || !formData) return
    
    setFormData(prev => ({
      ...prev!,
      [field]: [...(prev![field] || []), value.trim()]
    }))
  }

  const removeArrayItem = (field: 'features' | 'tags' | 'images', index: number) => {
    if (!formData) return
    
    setFormData(prev => ({
      ...prev!,
      [field]: (prev![field] || []).filter((_: any, i: number) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData || !formData.name || !formData.cuisine || !formData.address) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      await restaurantApi.update(formData.id, formData)
      toast.success('Restaurant updated successfully')
      router.push(`/restaurants/${formData.id}`)
    } catch (error) {
      console.error('Error updating restaurant:', error)
      toast.error('Failed to update restaurant')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
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

  if (!formData) {
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
            <p className="text-gray-500">The restaurant you're trying to edit doesn't exist.</p>
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
      <div className="flex items-center space-x-4">
        <Link href={`/restaurants/${formData.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Restaurant</h1>
          <p className="text-gray-600">Update restaurant information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about the restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Restaurant Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter restaurant name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cuisine">Cuisine Type *</Label>
                <Select value={formData.cuisine} onValueChange={(value) => handleInputChange('cuisine', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the restaurant..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Location</CardTitle>
            <CardDescription>How customers can reach and find the restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter full address"
                rows={2}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="restaurant@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., +977-1-4123456"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://restaurant-website.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maps_url">Maps URL</Label>
                <Input
                  id="maps_url"
                  value={formData.maps_url || ''}
                  onChange={(e) => handleInputChange('maps_url', e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                  placeholder="27.7172"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                  placeholder="85.3240"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Details */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Details</CardTitle>
            <CardDescription>Additional information about the restaurant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price_range">Price Range</Label>
              <Select value={formData.price_range} onValueChange={(value) => handleInputChange('price_range', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.features || []).map((feature: string, index: number) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm cursor-pointer"
                    onClick={() => removeArrayItem('features', index)}
                  >
                    {feature} ×
                  </span>
                ))}
              </div>
              <Input
                placeholder="Add feature (press Enter)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleArrayChange('features', e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
              />
            </div>

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
            {/* Images */}
            <CategorizedImageUpload
              label="Restaurant Images"
              value={{
                images: formData.images || [],
                cover_image: formData.cover_images?.[0] || undefined,
                menu_images: formData.menu_images || []
              }}
              onChange={(images) => {
                handleInputChange('images', images.images || [])
                handleInputChange('cover_images', images.cover_image ? [images.cover_image] : [])
                handleInputChange('menu_images', images.menu_images || [])
              }}
              folder="restaurants"
            />
            
            {/* Opening Hours */}
            <TimePicker
              label="Opening Hours"
              value={formData.opening_hours || {}}
              onChange={(hours) => handleInputChange('opening_hours', hours)}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Settings</CardTitle>
            <CardDescription>Configure restaurant status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_verified"
                  checked={formData.is_verified}
                  onCheckedChange={(checked) => handleInputChange('is_verified', checked)}
                />
                <Label htmlFor="is_verified">Verified</Label>
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
          <Link href={`/restaurants/${formData.id}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Restaurant
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Menu Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Management</CardTitle>
          <CardDescription>Manage menu items for this restaurant</CardDescription>
        </CardHeader>
        <CardContent>
          <MenuManagement 
            restaurantId={formData.id}
            initialMenuItems={[]}
            onMenuItemsChange={(items) => {
              // Menu items are now handled separately through the menu table
              console.log('Menu items updated:', items)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}