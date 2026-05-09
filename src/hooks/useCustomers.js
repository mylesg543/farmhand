import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true); setError(null)
    const { data, error } = await supabase
      .from('fh_customers')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setCustomers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addCustomer = async (values) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('fh_customers')
      .insert([{ ...values, user_id: user?.id }])
      .select().single()
    if (error) throw error
    setCustomers(prev => [...prev, data].sort((a,b) => a.name.localeCompare(b.name)))
    return data
  }

  const updateCustomer = async (id, values) => {
    const { data, error } = await supabase
      .from('fh_customers').update(values).eq('id', id).select().single()
    if (error) throw error
    setCustomers(prev => prev.map(c => c.id === id ? data : c))
    return data
  }

  const deleteCustomer = async (id) => {
    const { error } = await supabase.from('fh_customers').delete().eq('id', id)
    if (error) throw error
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  return { customers, loading, error, refetch: fetch, addCustomer, updateCustomer, deleteCustomer }
}
