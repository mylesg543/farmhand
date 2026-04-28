import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// fh_animal_events table
export function useAnimalEvents(animalId) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!animalId) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('fh_animal_events')
      .select('*')
      .eq('animal_id', animalId)
      .order('event_date', { ascending: false })
    if (error) setError(error.message)
    else setEvents(data || [])
    setLoading(false)
  }, [animalId])

  useEffect(() => { fetch() }, [fetch])

  const addEvent = async (values) => {
    const { data, error } = await supabase
      .from('fh_animal_events')
      .insert([{ ...values, animal_id: animalId }])
      .select()
      .single()
    if (error) throw error
    setEvents(prev => [data, ...prev])
    return data
  }

  const deleteEvent = async (id) => {
    const { error } = await supabase.from('fh_animal_events').delete().eq('id', id)
    if (error) throw error
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return { events, loading, error, refetch: fetch, addEvent, deleteEvent }
}
