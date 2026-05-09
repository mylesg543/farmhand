import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAnimals(species = 'sheep') {
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    const { data, error } = await supabase
      .from('fh_animals')
      .select('*')
      .eq('species', species)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setAnimals(data || [])
    setLoading(false)
  }, [species])

  useEffect(() => { fetch() }, [fetch])

  const addAnimal = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('fh_animals')
      .insert([{ ...values, species, user_id: user?.id }])
      .select().single()
    if (error) throw error
    setAnimals(prev => [data, ...prev])
    return data
  }

  const updateAnimal = async (id, values) => {
    const { data, error } = await supabase
      .from('fh_animals').update(values).eq('id', id).select().single()
    if (error) throw error
    setAnimals(prev => prev.map(a => a.id === id ? data : a))
    return data
  }

  const deleteAnimal = async (id) => {
    const { error } = await supabase.from('fh_animals').delete().eq('id', id)
    if (error) throw error
    setAnimals(prev => prev.filter(a => a.id !== id))
  }

  return { animals, loading, error, refetch: fetch, addAnimal, updateAnimal, deleteAnimal }
}

export function useSingleAnimal(id) {
  const [animal,  setAnimal]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase.from('fh_animals').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setAnimal(data)
        setLoading(false)
      })
  }, [id])

  return { animal, setAnimal, loading, error }
}
