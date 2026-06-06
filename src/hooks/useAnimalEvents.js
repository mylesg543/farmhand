import { useState, useEffect, useMemo } from 'react'
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
    if (emulated) {
      const { data, error } = await supabase.rpc('update_event_admin', {
        target_event_id: id,
        target_user_id: effectiveUid,
        payload,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      if (!row) throw new Error('The event was not updated.')
      setEvents(prev => prev.map(e => e.id === id ? row : e))
      return row
    }
    const { data, error } = await supabase.from('fh_animal_events')
      .update(payload).eq('id', id).eq('user_id', effectiveUid)
      .select()
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    setEvents(prev => prev.map(e => e.id === id ? row : e))
    return row
  }

  const deleteEvent = async (id) => {
    if (!canWrite) throw new Error('You are viewing this farm in read-only mode. Switch to Write Mode in the admin banner to delete events.')
    if (emulated) {
      const { data, error } = await supabase.rpc('delete_event_admin', {
        target_event_id: id,
        target_user_id: effectiveUid,
      })
      if (error) throw error
      if (!data) throw new Error('The event was not deleted.')
      setEvents(prev => prev.filter(e => e.id !== id))
      return
    }
    const { data, error } = await supabase.from('fh_animal_events')
      .delete().eq('id', id).eq('user_id', effectiveUid)
      .select('id')
    if (error) throw error
    if (!data?.length) {
      throw new Error('The event was not deleted. Your account may not have permission to delete this farm\'s events.')
    }
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const addPhotoToEvent = async (id, photoUrl) => {
    return updateEvent(id, { photo_url: photoUrl })
  }

  return { events, loading, error, refetch: fetch, addEvent, updateEvent, deleteEvent, addPhotoToEvent }
}

export function useRecentAnimalEvents(animals = []) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const emulated = getEmulated()
  const effectiveUid = emulated ? emulated.uid : user?.id
  const animalIds = useMemo(() => animals.map(a => a.id).filter(Boolean).sort().join(','), [animals])

  useEffect(() => {
    if (!effectiveUid) return
    if (animals.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        let data, err
        if (emulated) {
          const res = await supabase.rpc('get_user_events_admin', { target_user_id: effectiveUid })
          data = res.data
          err = res.error
        } else {
          const res = await supabase.from('fh_animal_events')
            .select('*')
            .eq('user_id', effectiveUid)
            .order('event_date', { ascending: false })
            .limit(300)
          data = res.data
          err = res.error
        }
        if (err) throw err
        const animalMap = new Map(animals.map(a => [a.id, a]))
        const scoped = (data || [])
          .filter(e => !animalIds || animalMap.has(e.animal_id))
          .map(e => ({ ...e, animal: animalMap.get(e.animal_id) || null }))
          .sort((a, b) => {
            const bd = b.event_date || b.created_at || ''
            const ad = a.event_date || a.created_at || ''
            return bd.localeCompare(ad)
          })
        setEvents(scoped)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetch()
  }, [effectiveUid, animalIds, emulated])

  return { events, loading, error }
}
