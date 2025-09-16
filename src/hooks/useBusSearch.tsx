import { useState, useCallback } from 'react'
import { searchService, BusSearchResult, BusSearchParams } from '@/services/searchService'

export function useBusSearch() {
  const [searchResults, setSearchResults] = useState<BusSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lastSearchParams, setLastSearchParams] = useState<BusSearchParams | null>(null)

  const searchBuses = useCallback(async (params: BusSearchParams) => {
    setIsSearching(true)
    setSearchError(null)
    setLastSearchParams(params)

    try {
      const results = await searchService.searchBuses(params)
      setSearchResults(results)
      
      if (results.length === 0) {
        setSearchError('No buses found connecting these locations. Try adjusting your search or check nearby areas.')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search for buses'
      setSearchError(errorMessage)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setSearchError(null)
    setLastSearchParams(null)
  }, [])

  const retrySearch = useCallback(() => {
    if (lastSearchParams) {
      searchBuses(lastSearchParams)
    }
  }, [lastSearchParams, searchBuses])

  return {
    searchResults,
    isSearching,
    searchError,
    lastSearchParams,
    searchBuses,
    clearSearch,
    retrySearch
  }
}
