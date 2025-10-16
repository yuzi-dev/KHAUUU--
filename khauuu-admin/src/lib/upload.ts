import { uploadImage as cloudinaryUpload, deleteImage as cloudinaryDelete } from './cloudinary'

// Re-export upload functions for consistency
export const uploadImage = cloudinaryUpload
export const deleteImage = cloudinaryDelete

// Additional upload utilities if needed
export async function uploadMultipleImages(files: File[], folder: string = 'khauuu'): Promise<string[]> {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder))
    return await Promise.all(uploadPromises)
  } catch (error) {
    console.error('Error uploading multiple images:', error)
    throw new Error('Failed to upload images')
  }
}

export async function uploadImageWithProgress(
  file: File, 
  folder: string = 'khauuu',
  onProgress?: (progress: number) => void
): Promise<string> {
  // For now, just use the regular upload function
  // In the future, this could be enhanced with progress tracking
  if (onProgress) {
    onProgress(0)
  }
  
  try {
    const result = await uploadImage(file, folder)
    if (onProgress) {
      onProgress(100)
    }
    return result
  } catch (error) {
    if (onProgress) {
      onProgress(0)
    }
    throw error
  }
}