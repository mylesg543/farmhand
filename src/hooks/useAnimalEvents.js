import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const EMULATION_KEY = 'fh_emulated_user'
function getEmulated() {
  try { return JSON.parse(localStorage.getItem(EMULATION_KEY)) } catch { return null }
}

export function useAnimalEvents(animalId) {
  const { user } = useAuth()
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const emulated     = getEmulated()
  const effectiveUid = emulated ? emulated.uid : user?.id
  const canWrite     = !emulated || emulated.writeMode

  const fetch = async () => {
    if (!effectiveUid || !animalId) return
    setLoading(true)
    try {
      let data, err
      if (emulated) {
        const res = await supabase.rpc('get_user_events_admin', { target_user_id: effectiveUid })
        data = (res.data || []).filter(e => e.animal_id === animalId)
        err  = res.error
      } else {
        const res = await supabase.from('fh_animal_events')
          .select('*').eq('animal_id', animalId).eq('user_id', effectiveUid)
          .order('event_date', { ascending: false })
        data = res.data
        err  = res.error
      }
      if (err) throw err
      setEvents(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user?.id, animalId, effectiveUid])

  const addEvent = async (payload) => {
    if (!canWrite) throw new Error('Read-only mode')
    let data, err
    if (emulated) {
      const res = await supabase.rpc('add_event_admin', {
        target_user_id: effectiveUid,
        payload: { ...payload, animal_id: animalId || payload.animal_id, user_id: effectiveUid }
      })
      data = Array.isArray(res.data) ? res.data[0] : res.data
      err  = res.error
    } else {
      const res = await supabase.from('fh_animal_events')
        .insert({ ...payload, animal_id: animalId, user_id: effectiveUid })
        .select().single()
      data = res.data
      err  = res.error
    }
    if (err) throw err
    setEvents(prev => [data, ...prev])
    return data
  }

  const updateEvent = async (id, payload) => {
    if (!canWrite) throw new Error('Read-only mode')
    const { data, error } = await supabase.from('fh_animal_events')
      .update(payload).eq('id', id).eq('user_id', effectiveUid)
      .select()
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    setEvents(prev => prev.map(e => e.id === id ? row : e))
    return row
  }

  const deleteEvent = async (id) => {
    if (!canWrite) throw new Error('Read-only mode')
    const { error } = await supabase.from('fh_animal_events')
      .delete().eq('id', id).eq('user_id', effectiveUid)
    if (error) throw error
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const addPhotoToEvent = async (id, photoUrl) => {
    return updateEvent(id, { photo_url: photoUrl })
  }

  return { events, loading, error, refetch: fetch, addEvent, updateEvent, deleteEvent, addPhotoToEvent }
}
