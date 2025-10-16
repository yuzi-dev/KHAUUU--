'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface DeferredImageUploadProps {
  label: string
  value: (File | string)[]
  onChange: (files: (File | string)[]) => void
  maxImages?: number
  className?: string
}

export function DeferredImageUpload({
  label,
  value = [],
  onChange,
  maxImages = 5,
  className = ''
}: DeferredImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    if (value.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    onChange([...value, ...files])
    toast.success(`${files.length} image(s) selected`)
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
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

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {/* Upload Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={value.length >= maxImages}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Select Images
        </Button>
        
        <span className="text-sm text-gray-500">
          {value.length}/{maxImages} images
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {value.map((item, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={getImageUrl(item)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
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

      {/* Empty State */}
      {value.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-gray-500 text-center">
              No images selected yet
            </p>
            <p className="text-sm text-gray-400 text-center mt-1">
              Click "Select Images" to choose photos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}