import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useAnimalEvents(animalId) {
  const { user } = useAuth()
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = async () => {
    if (!user || !animalId) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('fh_animal_events')
        .select('*')
        .eq('animal_id', animalId)
        .eq('user_id', user.id)
        .order('event_date', { ascending: false })
      if (error) throw error
      setEvents(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user, animalId])

  const addEvent = async (payload) => {
    const { data, error } = await supabase
      .from('fh_animal_events')
      .insert({ ...payload, animal_id: animalId, user_id: user.id })
      .select().single()
    if (error) throw error
    setEvents(prev => [data, ...prev])
    return data
  }

  const updateEvent = async (id, payload) => {
    const { data, error } = await supabase
      .from('fh_animal_events')
      .update(payload).eq('id', id).eq('user_id', user.id)
      .select().single()
    if (error) throw error
    setEvents(prev => prev.map(e => e.id === id ? data : e))
    return data
  }

  const deleteEvent = async (id) => {
    const { error } = await supabase
      .from('fh_animal_events')
      .delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const addPhotoToEvent = async (id, photoUrl) => {
    return updateEvent(id, { photo_url: photoUrl })
  }

  return { events, loading, error, refetch: fetch, addEvent, updateEvent, deleteEvent, addPhotoToEvent }
}
