'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/utils';
import { Category } from '@/types';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface FilterBarProps {
  filters: {
    category: Category | 'all';
    search: string;
  };
  onFilterChange: (filters: FilterBarProps['filters']) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search events by title..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-12 pr-4 py-3 bg-[var(--card)] border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--muted)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--muted-foreground)]" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`sm:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            filters.category !== 'all' ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--card)]'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </button>

        <div className={`sm:flex gap-2 ${showFilters ? 'flex' : 'hidden'} flex-wrap`}>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value as Category | 'all' })}
            className="px-4 py-3 bg-[var(--card)] border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
