import { useState, useEffect, useCallback, useRef } from 'react'
import { firebaseStopsService, FirebaseStop } from '@/services/firebaseStopsService'

// SearchSuggestion interface for location search
interface SearchSuggestion {
  id: string
  address: string
  name: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export function useAutocomplete() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const abortControllerRef = useRef<AbortController>()
  const lastSearchTimeRef = useRef<number>(0)

  const searchAddresses = useCallback(async (searchQuery: string) => {
    console.log('useAutocomplete: searchAddresses called with:', searchQuery)
    if (!searchQuery || searchQuery.length < 2) {
      console.log('useAutocomplete: Query too short, clearing suggestions')
      setSuggestions([])
      setIsOpen(false)
      return
    }

    // Rate limiting: prevent searches more than once per second
    const now = Date.now()
    if (now - lastSearchTimeRef.current < 1000) {
      console.log('useAutocomplete: Rate limited, skipping search')
      return
    }
    lastSearchTimeRef.current = now

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    console.log('useAutocomplete: Starting search...')
    
    try {
      // Search stops from Firebase routes
      const firebaseStops = await firebaseStopsService.searchStops(searchQuery, 5)
      
      // Convert FirebaseStop to SearchSuggestion
      const results: SearchSuggestion[] = firebaseStops.map(stop => ({
        id: stop.id,
        address: stop.address,
        name: stop.name,
        coordinates: stop.coordinates.lat !== 0 && stop.coordinates.lng !== 0 ? {
          lat: stop.coordinates.lat,
          lng: stop.coordinates.lng
        } : undefined
      }))
      
      console.log('useAutocomplete: Got results:', results.length, results)
      setSuggestions(results)
      setIsOpen(results.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.log('useAutocomplete: Error:', error)
      if (error instanceof Error && error.name !== 'AbortError') {
        setSuggestions([])
        setIsOpen(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleInputChange = useCallback((value: string) => {
    console.log('useAutocomplete: handleInputChange called with:', value)
    setQuery(value)
    
    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout for debounced search
    debounceTimeoutRef.current = setTimeout(() => {
      console.log('useAutocomplete: Debounced search triggered for:', value)
      searchAddresses(value)
    }, 800) // 800ms debounce to reduce API calls and avoid rate limiting
  }, [searchAddresses])

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.address)
    setSuggestions([])
    setIsOpen(false)
    setSelectedIndex(-1)
  }, [])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isOpen, suggestions, selectedIndex, handleSuggestionSelect])

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setSelectedIndex(-1)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    query,
    setQuery,
    suggestions,
    isLoading,
    isOpen,
    selectedIndex,
    handleInputChange,
    handleSuggestionSelect,
    handleKeyDown,
    closeDropdown
  }
}
