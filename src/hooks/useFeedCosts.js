import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useFeedCosts() {
  const { user } = useAuth()
  const [costs,   setCosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('fh_feed_costs')
        .select('*').eq('user_id', user.id).order('date', { ascending: false })
      if (error) throw error
      setCosts(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [user])

  const addCost = async (payload) => {
    const { data, error } = await supabase.from('fh_feed_costs')
      .insert({ ...payload, user_id: user.id }).select().single()
    if (error) throw error
    setCosts(prev => [data, ...prev])
    return data
  }

  const updateCost = async (id, payload) => {
    const { data, error } = await supabase.from('fh_feed_costs')
      .update(payload).eq('id', id).eq('user_id', user.id).select().single()
    if (error) throw error
    setCosts(prev => prev.map(c => c.id===id ? data : c))
    return data
  }

  const deleteCost = async (id) => {
    const { error } = await supabase.from('fh_feed_costs')
      .delete().eq('id', id).eq('user_id', user.id)
    if (error) throw error
    setCosts(prev => prev.filter(c => c.id !== id))
  }

  return { costs, loading, error, refetch: fetch, addCost, updateCost, deleteCost }
}
