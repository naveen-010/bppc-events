'use client';

import { CATEGORIES } from '@/lib/utils';
import { Category } from '@/types';
import { Search, X, ArrowUpDown } from 'lucide-react';

export type SortOption = 'event_date_asc' | 'event_date_desc' | 'deadline_asc' | 'deadline_desc';

interface FilterBarProps {
  filters: {
    category: Category | 'all';
    search: string;
    sort: SortOption;
  };
  onFilterChange: (filters: FilterBarProps['filters']) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-12 pr-10 py-3 bg-[var(--card)] border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all"
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

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-[var(--muted-foreground)]" />
          <select
            value={filters.sort}
            onChange={(e) => onFilterChange({ ...filters, sort: e.target.value as SortOption })}
            className="px-4 py-3 bg-[var(--card)] border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent cursor-pointer"
          >
            <option value="event_date_asc">Soonest Event</option>
            <option value="event_date_desc">Latest Event</option>
            <option value="deadline_asc">Deadline: Earliest First</option>
            <option value="deadline_desc">Deadline: Latest First</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange({ ...filters, category: 'all' })}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filters.category === 'all'
              ? 'bg-[var(--foreground)] text-[var(--background)]'
              : 'bg-[var(--card)] border text-[var(--muted-foreground)] hover:border-[var(--foreground)]'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onFilterChange({ ...filters, category: cat.value })}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filters.category === cat.value
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--card)] border text-[var(--muted-foreground)] hover:border-[var(--foreground)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
