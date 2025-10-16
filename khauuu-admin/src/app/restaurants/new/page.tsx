'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
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
import { restaurantApi } from '@/lib/api/restaurants'
import { CreateRestaurantData } from '@/types/database'
import { toast } from 'sonner'
import { DeferredCategorizedImageUpload } from '@/components/ui/deferred-categorized-image-upload'
import { uploadImage } from '@/lib/upload'
import { TimePicker } from '@/components/ui/time-picker'
import { MenuManagement } from '@/components/ui/menu-management'
import { useAuth } from '@/contexts/AuthContext'

// Memoized constants to prevent unnecessary re-renders
const cuisineTypes = [
  'Nepali', 'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 
  'Thai', 'Japanese', 'Korean', 'American', 'Mediterranean', 'Fast Food'
] as const

const priceRanges = [
  { value: '$', label: '$ - Budget (Under Rs. 500)' },
  { value: '$$', label: '$$ - Moderate (Rs. 500-1000)' },
  { value: '$$$', label: '$$$ - Expensive (Rs. 1000-2000)' },
  { value: '$$$$', label: '$$$$ - Very Expensive (Above Rs. 2000)' }
] as const

export default function NewRestaurantPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<CreateRestaurantData>({
    name: '',
    cuisine: '',
    description: '',
    address: '',
    phone: '',
    website: '',
    email: '',
    latitude: 0,
    longitude: 0,
    location_name: '',
    maps_url: '',
    opening_hours: {},
    is_open: true,
    price_range: '$$',
    features: [], // Changed from {} to []
    tags: [], // Changed from {} to []
    images: [],
    cover_images: [],
    menu_images: [],
    is_active: true,
    is_verified: false,
    is_featured: false
    // Removed owner_id initialization
  })

  // Removed useEffect for owner_id

  // Memoized image upload value with stable reference - now supports File objects
  const imageUploadValue = useMemo(() => ({
    images: formData.images || [],
    cover_image: (formData.cover_images || [])[0] || null,
    menu_images: formData.menu_images || []
  }), [formData.images, formData.cover_images, formData.menu_images])

  // Memoized opening hours value
  const openingHoursValue = useMemo(() => formData.opening_hours || {}, [formData.opening_hours])

  // Immediate input change handler - no debouncing for maximum responsiveness
  const handleInputChange = useCallback((field: keyof CreateRestaurantData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  // Optimized array change handler
  const handleArrayChange = useCallback((field: 'features' | 'tags' | 'images', value: string) => {
    if (!value.trim()) return
    
    setFormData(prev => {
      const currentArray = prev[field] || []
      // Prevent duplicates
      if (currentArray.includes(value.trim())) return prev
      
      return {
        ...prev,
        [field]: [...currentArray, value.trim()]
      }
    })
  }, [])

  // Optimized remove array item handler
  const removeArrayItem = useCallback((field: 'features' | 'tags' | 'images', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_: any, i: number) => i !== index)
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Validate required fields first - before any uploads
      if (!formData.name || !formData.cuisine || !formData.address) {
        toast.error('Please fill in all required fields')
        return
      }

      // Additional validation
      if (!formData.phone || !formData.email) {
        toast.error('Please provide phone and email')
        return
      }

      // Validate owner_id is present and valid - REMOVED
      // if (!formData.owner_id || !user?.id) {
      //   toast.error('Authentication error. Please refresh the page and try again.')
      //   return
      // }

      // Upload images first, but keep track of uploaded URLs for cleanup if needed
      const uploadedUrls: string[] = []
      const uploadedData = { ...formData }
      
      try {
        // Upload cover image
        if (formData.cover_images && formData.cover_images.length > 0) {
          const coverFile = formData.cover_images[0]
          if (coverFile instanceof File) {
            const coverUrl = await uploadImage(coverFile, 'restaurants')
            uploadedUrls.push(coverUrl)
            uploadedData.cover_images = [coverUrl]
          }
        }
        
        // Upload gallery images
        if (formData.images && formData.images.length > 0) {
          const imageUrls = await Promise.all(
            formData.images.map(async (image: File | string) => {
              if (image instanceof File) {
                const url = await uploadImage(image, 'restaurants')
                uploadedUrls.push(url)
                return url
              }
              return image // Already uploaded URL
            })
          )
          uploadedData.images = imageUrls
        }
        
        // Upload menu images
        if (formData.menu_images && formData.menu_images.length > 0) {
          const menuUrls = await Promise.all(
            formData.menu_images.map(async (image: File | string) => {
              if (image instanceof File) {
                const url = await uploadImage(image, 'restaurants')
                uploadedUrls.push(url)
                return url
              }
              return image // Already uploaded URL
            })
          )
          uploadedData.menu_images = menuUrls
        }
        
        // Now create the restaurant with uploaded images
        // Removed owner_id assignment
        const finalData = {
          ...uploadedData
          // Removed owner_id: user.id
        }
        
        await restaurantApi.create(finalData)
        toast.success('Restaurant created successfully')
        router.push('/restaurants')
        
      } catch (uploadOrDbError) {
        // If there was an error after uploading images, we should ideally clean them up
        // For now, we'll log the uploaded URLs for manual cleanup if needed
        if (uploadedUrls.length > 0) {
          console.warn('Images were uploaded but restaurant creation failed. Uploaded URLs:', uploadedUrls)
        }
        throw uploadOrDbError // Re-throw to be handled by outer catch
      }
      
    } catch (error) {
      console.error('Error creating restaurant:', error)
      // Better error logging
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message
        console.error('Error details:', errorMessage)
        toast.error(`Failed to create restaurant: ${errorMessage}`)
      } else {
        console.error('Unknown error:', JSON.stringify(error))
        toast.error('Failed to create restaurant. Please check all fields and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">You need to be logged in to create a restaurant.</p>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/restaurants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Restaurant</h1>
          <p className="text-gray-600">Create a new restaurant listing</p>
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
                value={formData.description}
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
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="restaurant@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
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
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://restaurant-website.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maps_url">Maps URL</Label>
                <Input
                  id="maps_url"
                  value={formData.maps_url}
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

            {/* Restaurant Images */}
            <DeferredCategorizedImageUpload
              label="Restaurant Images"
              value={imageUploadValue}
              onChange={(imageData) => {
                setFormData(prev => ({
                  ...prev,
                  images: imageData.images || [],
                  cover_images: imageData.cover_image ? [imageData.cover_image] : [],
                  menu_images: imageData.menu_images || []
                }))
              }}
            />
            
            {/* Opening Hours */}
            <TimePicker
              label="Opening Hours"
              value={openingHoursValue}
              onChange={(hours) => handleInputChange('opening_hours', hours)}
            />

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
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Settings</CardTitle>
            <CardDescription>Configure restaurant status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <Link href="/restaurants">
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
                Create Restaurant
              </>
            )}
          </Button>
        </div>
      </form>

        {/* Menu Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>Menu Management</CardTitle>
            <CardDescription>Add menu items for this restaurant (optional)</CardDescription>
          </CardHeader>
          <CardContent>
            <MenuManagement 
              restaurantId="new"
              initialMenuItems={[]}
              onMenuItemsChange={(items) => {
                // Menu items will be handled separately through the menu table
                console.log('Menu items updated:', items);
              }}
            />
          </CardContent>
        </Card>
      </div>
    )
  }