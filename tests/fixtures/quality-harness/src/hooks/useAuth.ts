import { useState, useEffect } from 'react'

export function useAuth(): { token: string | null; loading: boolean } {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('token')
    setToken(stored)
    setLoading(false)
  }, [])

  return { token, loading }
}
