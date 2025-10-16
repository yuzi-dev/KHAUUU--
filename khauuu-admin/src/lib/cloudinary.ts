// Upload image to Cloudinary using the upload preset approach
export async function uploadImage(file: File, folder: string = 'khauuu'): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'khauuu_unsigned') // Use a proper unsigned upload preset
    formData.append('folder', folder)

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    
    if (!cloudName) {
      throw new Error('Cloudinary cloud name not configured')
    }

    console.log('Uploading to Cloudinary:', {
      cloudName,
      folder,
      fileName: file.name,
      fileSize: file.size
    })

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Cloudinary upload error:', errorData)
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Upload successful:', result.secure_url)
    return result.secure_url
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error)
    throw new Error('Failed to upload image')
  }
}

// Delete image from Cloudinary (client-side approach)
export async function deleteImage(publicId: string): Promise<void> {
  try {
    // For client-side deletion, you would typically call your own API endpoint
    // that handles the server-side deletion using the Cloudinary SDK
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    })

    if (!response.ok) {
      throw new Error('Delete failed')
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error)
    throw new Error('Failed to delete image')
  }
}

// Extract public ID from Cloudinary URL
export function getPublicIdFromUrl(url: string): string {
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  return filename.split('.')[0]
}