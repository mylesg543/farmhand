import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePlants() {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    const { data, error } = await supabase
      .from('fh_plants')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setPlants(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addPlant = async (values) => {
    const { data, error } = await supabase.from('fh_plants').insert([values]).select().single()
    if (error) throw error
    setPlants(prev => [data, ...prev])
    return data
  }

  const updatePlant = async (id, values) => {
    const { data, error } = await supabase.from('fh_plants').update(values).eq('id', id).select().single()
    if (error) throw error
    setPlants(prev => prev.map(p => p.id === id ? data : p))
    return data
  }

  const deletePlant = async (id) => {
    const { error } = await supabase.from('fh_plants').delete().eq('id', id)
    if (error) throw error
    setPlants(prev => prev.filter(p => p.id !== id))
  }

  return { plants, loading, error, refetch: fetch, addPlant, updatePlant, deletePlant }
}

export function useSinglePlant(id) {
  const [plant, setPlant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase.from('fh_plants').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setPlant(data)
        setLoading(false)
      })
  }, [id])

  return { plant, setPlant, loading, error }
}

export function usePlantEvents(plantId) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!plantId) return
    setLoading(true); setError(null)
    const { data, error } = await supabase
      .from('fh_plant_events')
      .select('*')
      .eq('plant_id', plantId)
      .order('event_date', { ascending: false })
    if (error) setError(error.message)
    else setEvents(data || [])
    setLoading(false)
  }, [plantId])

  useEffect(() => { fetch() }, [fetch])

  const addEvent = async (values) => {
    const { data, error } = await supabase.from('fh_plant_events').insert([{ ...values, plant_id: plantId }]).select().single()
    if (error) throw error
    setEvents(prev => [data, ...prev])
    return data
  }

  const deleteEvent = async (id) => {
    const { error } = await supabase.from('fh_plant_events').delete().eq('id', id)
    if (error) throw error
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return { events, loading, error, refetch: fetch, addEvent, deleteEvent }
}
