import React, { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { SearchSuggestion } from '@/services/searchService'
import { MapPin, Loader2 } from 'lucide-react'

interface AutocompleteInputProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: SearchSuggestion) => void
  suggestions: SearchSuggestion[]
  isLoading: boolean
  isOpen: boolean
  selectedIndex: number
  onKeyDown: (event: React.KeyboardEvent) => void
  onClose: () => void
  className?: string
}

export function AutocompleteInput({
  placeholder,
  value,
  onChange,
  onSelect,
  suggestions,
  isLoading,
  isOpen,
  selectedIndex,
  onKeyDown,
  onClose,
  className = ''
}: AutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={`${className} ${isOpen ? 'rounded-b-none' : ''}`}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full bg-white border border-gray-200 rounded-b-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`px-3 py-2 cursor-pointer flex items-center gap-2 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${index === suggestions.length - 1 ? 'rounded-b-md' : ''}`}
              onClick={() => onSelect(suggestion)}
            >
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {suggestion.address}
                </p>
                {suggestion.type && (
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.type}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && suggestions.length === 0 && !isLoading && value.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full bg-white border border-gray-200 rounded-b-md shadow-lg"
        >
          <div className="px-3 py-2 text-sm text-gray-500">
            No results found for "{value}"
          </div>
        </div>
      )}
    </div>
  )
}
