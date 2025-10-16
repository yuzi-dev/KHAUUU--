'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { uploadImage } from '@/lib/cloudinary'
import { toast } from 'sonner'

interface ImageUploadProps {
  label: string
  value: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  folder?: string
  className?: string
}

export function ImageUpload({
  label,
  value = [],
  onChange,
  maxImages = 5,
  folder = 'khauuu',
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    if (value.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    
    try {
      const uploadPromises = files.map(file => uploadImage(file, folder))
      const uploadedUrls = await Promise.all(uploadPromises)
      
      onChange([...value, ...uploadedUrls])
      toast.success(`${files.length} image(s) uploaded successfully`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
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
          disabled={uploading || value.length >= maxImages}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Uploading...' : 'Upload Images'}
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
          {value.map((url, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={url}
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
              No images uploaded yet
            </p>
            <p className="text-sm text-gray-400 text-center mt-1">
              Click "Upload Images" to add photos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}