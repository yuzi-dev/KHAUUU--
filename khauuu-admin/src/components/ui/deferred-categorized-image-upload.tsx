'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface DeferredCategorizedImageUploadProps {
  label: string
  value: {
    images?: (File | string)[]
    cover_image?: File | string | null
    menu_images?: (File | string)[]
  }
  onChange: (images: {
    images?: (File | string)[]
    cover_image?: File | string | null
    menu_images?: (File | string)[]
  }) => void
  className?: string
}

export function DeferredCategorizedImageUpload({
  label,
  value = {},
  onChange,
  className = ''
}: DeferredCategorizedImageUploadProps) {
  const imagesInputRef = useRef<HTMLInputElement | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)
  const menuInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'images' | 'cover_image' | 'menu_images'
  ) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return

    if (type === 'cover_image') {
      if (files.length > 1) {
        toast.error('Only one cover image allowed')
        return
      }
      onChange({
        ...value,
        cover_image: files[0]
      })
      toast.success('Cover image selected')
    } else {
      const currentImages = value[type] || []
      const maxImages = type === 'images' ? 5 : 10
      
      if (currentImages.length + files.length > maxImages) {
        toast.error(`Maximum ${maxImages} ${type.replace('_', ' ')} allowed`)
        return
      }

      onChange({
        ...value,
        [type]: [...currentImages, ...files]
      })
      toast.success(`${files.length} ${type.replace('_', ' ')} selected`)
    }

    // Clear the input
    event.target.value = ''
  }

  const removeImage = (type: 'images' | 'cover_image' | 'menu_images', index?: number) => {
    if (type === 'cover_image') {
      onChange({
        ...value,
        cover_image: null
      })
    } else {
      const currentImages = value[type] || []
      const newImages = currentImages.filter((_, i) => i !== index)
      onChange({
        ...value,
        [type]: newImages
      })
    }
  }

  const getImageUrl = (item: File | string): string => {
    if (typeof item === 'string') {
      return item // Already uploaded URL
    }
    return URL.createObjectURL(item) // Create preview URL for File
  }

  const isFile = (item: File | string): item is File => {
    return item instanceof File
  }

  const renderImageSection = (
    title: string,
    type: 'images' | 'cover_image' | 'menu_images',
    inputRef: React.RefObject<HTMLInputElement | null>,
    maxImages: number,
    multiple: boolean = true
  ) => {
    const currentImages = type === 'cover_image' 
      ? (value.cover_image ? [value.cover_image] : [])
      : (value[type] || [])

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={currentImages.length >= maxImages}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Select {title}
            </Button>
            
            <span className="text-sm text-gray-500">
              {currentImages.length}/{maxImages} images
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

          {currentImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {currentImages.map((item, index) => (
                <Card key={index} className="relative group">
                  <CardContent className="p-2">
                    <div className="relative aspect-square">
                      <img
                        src={getImageUrl(item)}
                        alt={`${title} ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(type, type === 'cover_image' ? undefined : index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      {/* Show indicator for new files */}
                      {isFile(item) && (
                        <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                          New
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {currentImages.length === 0 && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-6">
                <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 text-center">
                  No {title.toLowerCase()} selected
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      <div className="space-y-4">
        {renderImageSection('Cover Image', 'cover_image', coverInputRef, 1, false)}
        {renderImageSection('Gallery Images', 'images', imagesInputRef, 5, true)}
        {renderImageSection('Menu Images', 'menu_images', menuInputRef, 10, true)}
      </div>
    </div>
  )
}