'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/utils';
import { Category } from '@/types';

interface FilterBarProps {
  filters: {
    category: Category | 'all';
    fee: 'all' | 'free' | 'paid';
    search: string;
  };
  onFilterChange: (filters: FilterBarProps['filters']) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search events..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value as Category | 'all' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={filters.fee}
            onChange={(e) => onFilterChange({ ...filters, fee: e.target.value as 'all' | 'free' | 'paid' })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Events</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
          </select>
        </div>
      </div>
    </div>
  );
}
