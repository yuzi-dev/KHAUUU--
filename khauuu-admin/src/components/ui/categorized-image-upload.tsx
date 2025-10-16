'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadImage } from '@/lib/cloudinary'
import { toast } from 'sonner'

interface CategorizedImageUploadProps {
  label: string
  value: {
    images?: string[]
    cover_image?: string
    menu_images?: string[]
  }
  onChange: (images: {
    images?: string[]
    cover_image?: string
    menu_images?: string[]
  }) => void
  folder?: string
  className?: string
}

export function CategorizedImageUpload({
  label,
  value = {},
  onChange,
  folder = 'khauuu',
  className = ''
}: CategorizedImageUploadProps) {
  const [uploading, setUploading] = useState<{
    images: boolean
    cover_image: boolean
    menu_images: boolean
  }>({
    images: false,
    cover_image: false,
    menu_images: false
  })
  
  const imagesInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const menuInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'images' | 'cover_image' | 'menu_images'
  ) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    // Validation based on type
    if (type === 'cover_image' && files.length > 1) {
      toast.error('Only one cover image allowed')
      return
    }

    const maxImages = type === 'cover_image' ? 1 : type === 'images' ? 10 : 5
    const currentCount = type === 'cover_image' ? (value.cover_image ? 1 : 0) : (value[type]?.length || 0)
    
    if (currentCount + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} ${type.replace('_', ' ')} allowed`)
      return
    }

    setUploading(prev => ({ ...prev, [type]: true }))
    
    try {
      const uploadPromises = files.map(file => uploadImage(file, `${folder}/${type}`))
      const uploadedUrls = await Promise.all(uploadPromises)
      
      if (type === 'cover_image') {
        onChange({
          ...value,
          cover_image: uploadedUrls[0]
        })
      } else {
        onChange({
          ...value,
          [type]: [...(value[type] || []), ...uploadedUrls]
        })
      }
      
      toast.success(`${files.length} ${type.replace('_', ' ')} uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }))
    }

    // Reset input
    event.target.value = ''
  }

  const removeImage = (type: 'images' | 'cover_image' | 'menu_images', index?: number) => {
    if (type === 'cover_image') {
      onChange({
        ...value,
        cover_image: undefined
      })
    } else if (typeof index === 'number') {
      const updatedImages = [...(value[type] || [])]
      updatedImages.splice(index, 1)
      onChange({
        ...value,
        [type]: updatedImages
      })
    }
  }

  const ImageSection = ({ 
    type, 
    title, 
    description, 
    inputRef, 
    maxImages,
    multiple = true 
  }: {
    type: 'images' | 'cover_image' | 'menu_images'
    title: string
    description: string
    inputRef: React.RefObject<HTMLInputElement | null>
    maxImages: number
    multiple?: boolean
  }) => {
    const currentImages = type === 'cover_image' 
      ? (value.cover_image ? [value.cover_image] : [])
      : (value[type] || [])

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
          <p className="text-xs text-gray-500">{description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {currentImages.map((url, index) => (
              <div key={index} className="relative group">
                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={url}
                    alt={`${title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(type, type === 'cover_image' ? undefined : index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading[type] || currentImages.length >= maxImages}
              className="flex items-center gap-2"
            >
              {uploading[type] ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading[type] ? 'Uploading...' : `Add ${title}`}
            </Button>
            
            <span className="text-xs text-gray-500">
              {currentImages.length}/{maxImages}
            </span>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={(e) => handleFileSelect(e, type)}
            className="hidden"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-base font-medium">{label}</Label>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ImageSection
          type="cover_image"
          title="Cover Image"
          description="Main restaurant image (1 image)"
          inputRef={coverInputRef}
          maxImages={1}
          multiple={false}
        />
        
        <ImageSection
          type="images"
          title="Gallery Images"
          description="Restaurant photos (up to 10 images)"
          inputRef={imagesInputRef}
          maxImages={10}
        />
        
        <ImageSection
          type="menu_images"
          title="Menu Images"
          description="Menu photos (up to 5 images)"
          inputRef={menuInputRef}
          maxImages={5}
        />
      </div>
    </div>
  )
}