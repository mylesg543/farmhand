import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePhotoUpload() {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const uploadPhoto = async (file, animalId) => {
    setUploading(true)
    setUploadError(null)
    try {
      const ext = file.name.split('.').pop()
      const path = `${animalId}-${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('fh-animal-photos')
        .upload(path, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data } = supabase.storage
        .from('fh-animal-photos')
        .getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      setUploadError(err.message)
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploadPhoto, uploading, uploadError }
}
