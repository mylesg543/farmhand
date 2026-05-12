import { useState } from 'react'
import { supabase } from '../lib/supabase'

const BUCKET = 'fh-animal-photos'

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)

  const upload = async (file) => {
    if (!file) throw new Error('No file provided')
    setUploading(true)
    setError(null)
    try {
      // Unique filename: timestamp + random + original extension
      const ext      = file.name.split('.').pop().toLowerCase()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path     = `events/${filename}`

      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      if (!urlData?.publicUrl) throw new Error('Could not get public URL')
      return urlData.publicUrl

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error }
}
