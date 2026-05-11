import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useAnimals(species) {
  const { user } = useAuth()
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = async () => {
    if (!user) return
    setLoading(true)
    try {
      let q = supabase.from('fh_animals').select('*').eq('user_id', user.id).order('name')
      if (species) q = q.eq('species', species)
      const { data, error } = await q
      if (error) throw error
      setAnimals(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user, species])

  const addAnimal = async (payload) => {
    const { data, error } = await supabase.from('fh_animals')
      .insert({ ...payload, user_id: user.id })
      .select().single()
    if (error) throw error
    setAnimals(prev => [...prev, data].sort((a,b)=>a.name.localeCompare(b.name)))
    return data
  }

  const updateAnimal = async (id, payload) => {
    const { data, error } = await supabase.from('fh_animals')
      .update(payload).eq('id', id).eq('user_id', user.id)
      .select().single()
    if (error) throw error
    setAnimals(prev => prev.map(a => a.id===id ? data : a))
    return data
  }

  const deleteAnimal = async (id) => {
    const { error } = await supabase.from('fh_animals')
      .delete().eq('id', id).eq('user_id', user.id)
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

  useEffect(() => {
    if (!user || !id) return
    const fetch = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('fh_animals')
          .select('*').eq('id', id).eq('user_id', user.id).single()
        if (error) throw error
        setAnimal(data)
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetch()
  }, [user, id])

  return { animal, loading, error }
}
