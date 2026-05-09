import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFeedCosts() {
  const [costs,   setCosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase
      .from('fh_feed_costs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (error) setError(error.message)
    else setCosts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addCost = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('fh_feed_costs')
      .insert([{ ...values, user_id: user?.id }])
      .select().single()
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
