import React, { useState, useEffect, useRef } from 'react';
import { Pill, Search, Check, Sparkles, AlertCircle } from 'lucide-react';
import { suggestMedicines, getLocalMedicineCatalog } from '../../services/medicineService';

/**
 * Highlight matching query substring in text
 */
const HighlightMatch = ({ text = '', query = '' }) => {
  if (!query || !text) return <span>{text}</span>;
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const index = lower.indexOf(q);

  if (index === -1) return <span>{text}</span>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + q.length);
  const after = text.slice(index + q.length);

  return (
    <span>
      {before}
      <span className="bg-teal-100 text-[#0C8F92] font-bold rounded-xs px-0.5">{match}</span>
      {after}
    </span>
  );
};

export const MedicineAutocompleteInput = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Type medicine name (e.g. Dolo, Augmentin, Pan, Telma)...',
  className = '',
  required = false,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Synchronize internal query with external value prop
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Preload local catalog in background on component mount for 0ms latency
  useEffect(() => {
    getLocalMedicineCatalog();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const list = await suggestMedicines(searchTerm, 12);
      setSuggestions(list);
      setIsOpen(list.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Error in medicine autocomplete:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    setQuery(newVal);
    if (onChange) {
      onChange(newVal);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newVal);
    }, 120);
  };

  const handleFocus = () => {
    if (query && query.trim().length >= 1) {
      fetchSuggestions(query);
    }
  };

  const handleSelectMedicine = (med) => {
    setQuery(med.name);
    setIsOpen(false);
    setSuggestions([]);
    if (onChange) {
      onChange(med.name);
    }
    if (onSelect) {
      onSelect(med);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectMedicine(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          autoComplete="off"
          className={`w-full bg-white border border-[#D9E4E5] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#172033] font-semibold focus:outline-none focus:border-[#0EA5A8] focus:ring-2 focus:ring-[#0EA5A8]/15 transition-all ${className}`}
        />

        {loading && (
          <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] text-[#0EA5A8]">
            <div className="w-3.5 h-3.5 border-2 border-[#0EA5A8] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-80 overflow-y-auto bg-white rounded-2xl border border-[#D9E4E5] shadow-xl divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          
          {/* Header Bar */}
          <div className="sticky top-0 bg-[#F8FAFC]/95 backdrop-blur-xs px-3 py-1.5 border-b border-[#D9E4E5] flex items-center justify-between text-[10px] text-[#64748B] font-medium z-10">
            <span className="flex items-center gap-1 text-[#0EA5A8] font-semibold">
              <Sparkles className="w-3 h-3" />
              10,000+ Verified Medicine Formulary
            </span>
            <span>Use ↑↓ keys & Enter</span>
          </div>

          {/* Suggestion list */}
          {suggestions.map((med, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={med._id || med.name + idx}
                type="button"
                onClick={() => handleSelectMedicine(med)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-3.5 py-2.5 flex items-start justify-between gap-2 transition-colors ${
                  isSelected ? 'bg-[#E6F7F7] text-[#172033]' : 'hover:bg-slate-50 text-[#172033]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`mt-0.5 p-1 rounded-lg ${isSelected ? 'bg-[#0EA5A8] text-white' : 'bg-slate-100 text-[#0EA5A8]'}`}>
                    <Pill className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      <HighlightMatch text={med.name} query={query} />
                      {med.strength && (
                        <span className="ml-1.5 text-[11px] font-medium text-[#64748B]">
                          {med.strength}
                        </span>
                      )}
                    </div>
                    {med.genericName && (
                      <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                        <span className="font-semibold text-slate-500">Generic: </span>
                        <HighlightMatch text={med.genericName} query={query} />
                      </div>
                    )}
                    {med.category && (
                      <div className="text-[10px] text-teal-700/80 mt-0.5 truncate font-medium">
                        {med.category} • {med.dosage || '1 unit'} ({med.frequency || 'As directed'})
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-[#475569] border border-slate-200">
                    {med.form || 'Tablet'}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] text-[#0EA5A8] font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Select
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
