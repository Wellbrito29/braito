import { useState, useEffect } from 'react'
import { searchApi } from './searchApi'

// TODO: remove legacy fallback
export function useImageSearch(query: string) {
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    if (!query) return
    searchApi.search(query).then(setResults)
  }, [query])

  return results
}
