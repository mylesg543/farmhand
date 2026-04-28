import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// fh_feed_costs table
export function useFeedCosts() {
  const [costs, setCosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('fh_feed_costs')
      .select('*')
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setCosts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addCost = async (values) => {
    const { data, error } = await supabase
      .from('fh_feed_costs')
      .insert([values])
      .select()
      .single()
    if (error) throw error
    setCosts(prev => [data, ...prev])
    return data
  }

  const deleteCost = async (id) => {
    const { error } = await supabase.from('fh_feed_costs').delete().eq('id', id)
    if (error) throw error
    setCosts(prev => prev.filter(c => c.id !== id))
  }

  return { costs, loading, error, refetch: fetch, addCost, deleteCost }
}
