import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function autoTagNumber() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `AUTO-${Date.now()}-${suffix}`
}

function normalizeAnimalCreatePayload(values, species) {
  return {
    ...values,
    species,
    name: String(values.name || '').trim(),
    tag_number: String(values.tag_number || '').trim() || autoTagNumber(),
    sex: values.sex || null,
    birth_date: values.birth_date || null,
    breed: values.breed || null,
    sire_id: values.sire_id || null,
    dam_id: values.dam_id || null,
    notes: values.notes || null,
    photo_url: values.photo_url || null,
  }
}

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
    const payload = normalizeAnimalCreatePayload(values, species)
    const { data, error } = await supabase
      .from('fh_animals')
      .insert([{ ...payload, user_id: user?.id }])
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
