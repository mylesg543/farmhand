import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const EMULATION_KEY = 'fh_emulated_user'
export function getEmulated() {
  try { return JSON.parse(localStorage.getItem(EMULATION_KEY)) } catch { return null }
}

export function useAnimals(species) {
  const { user } = useAuth()
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const emulated     = getEmulated()
  const effectiveUid = emulated ? emulated.uid : user?.id
  const canWrite     = !emulated || emulated.writeMode

  const fetch = async () => {
    if (!effectiveUid) return
    setLoading(true)
    setError(null)
    try {
      let data, err

      if (emulated) {
        // Use admin RPC to bypass RLS
        const res = await supabase.rpc('get_user_animals_admin', { target_user_id: effectiveUid })
        data = res.data
        err  = res.error
      } else {
        let q = supabase.from('fh_animals').select('*').eq('user_id', effectiveUid).order('name')
        if (species) q = q.eq('species', species)
        const res = await q
        data = res.data
        err  = res.error
      }

      if (err) throw err
      // Filter by species client-side when emulating (RPC returns all)
      const filtered = species ? (data||[]).filter(a => a.species === species) : (data||[])
      setAnimals(filtered.sort((a,b) => a.name.localeCompare(b.name)))
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user?.id, species, effectiveUid])

  const addAnimal = async (payload) => {
    if (!canWrite) throw new Error('Read-only mode — switch to write mode to make changes')
    if (emulated) {
      const { data, error } = await supabase.rpc('add_animal_admin', {
        target_user_id: effectiveUid,
        payload: payload,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      setAnimals(prev => [...prev, row].sort((a,b) => a.name.localeCompare(b.name)))
      return row
    }
    const { data, error } = await supabase.from('fh_animals')
      .insert({ ...payload, user_id: effectiveUid })
      .select()
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    setAnimals(prev => [...prev, row].sort((a,b) => a.name.localeCompare(b.name)))
    return row
  }

  const updateAnimal = async (id, payload) => {
    if (!canWrite) throw new Error('Read-only mode — switch to write mode to make changes')
    if (emulated) {
      const { data, error } = await supabase.rpc('update_animal_admin', {
        target_animal_id: id,
        target_user_id: effectiveUid,
        payload: payload,
      })
      if (error) throw error
      const row = Array.isArray(data) ? data[0] : data
      setAnimals(prev => prev.map(a => a.id === id ? row : a))
      return row
    }
    const { data, error } = await supabase.from('fh_animals')
      .update(payload).eq('id', id).eq('user_id', effectiveUid)
      .select()
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    setAnimals(prev => prev.map(a => a.id === id ? row : a))
    return row
  }

  const deleteAnimal = async (id) => {
    if (!canWrite) throw new Error('Read-only mode — switch to write mode to make changes')
    const { error } = await supabase.from('fh_animals')
      .delete().eq('id', id).eq('user_id', effectiveUid)
    if (error) throw error
    setAnimals(prev => prev.filter(a => a.id !== id))
  }

  return { animals, loading, error, refetch: fetch, addAnimal, updateAnimal, deleteAnimal }
}

export function useSingleAnimal(id) {
  const { user } = useAuth()
  const [animal,  setAnimal]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const emulated     = getEmulated()
  const effectiveUid = emulated ? emulated.uid : user?.id

  useEffect(() => {
    if (!effectiveUid || !id) return
    const fetch = async () => {
      setLoading(true)
      try {
        // Use admin RPC when emulating to bypass RLS
        if (emulated) {
          const { data, error } = await supabase.rpc('get_user_animals_admin', { target_user_id: effectiveUid })
          if (error) throw error
          const found = (data||[]).find(a => a.id === id)
          if (!found) throw new Error('Animal not found')
          setAnimal(found)
        } else {
          const { data, error } = await supabase.from('fh_animals')
            .select('*').eq('id', id).eq('user_id', effectiveUid).single()
          if (error) throw error
          setAnimal(data)
        }
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetch()
  }, [user?.id, id, effectiveUid])

  return { animal, loading, error }
}
