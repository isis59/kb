import React, { useState, useCallback } from 'react';
import { useKBStore } from '../store/kbStore';
import Fuse from 'fuse.js';
import { Search, X } from 'lucide-react';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');
  const { articles } = useKBStore();

  const handleSearch = useCallback((value) => {
    setQuery(value);
    
    if (!value.trim()) {
      onSearch(null);
      return;
    }

    // Use Fuse.js for fuzzy search
    const fuse = new Fuse(Object.values(articles), {
      keys: ['title', 'content'],
      threshold: 0.3,
    });

    const results = fuse.search(value).map(result => result.item);
    onSearch(results);
  }, [articles, onSearch]);

  return (
    <div className="flex-1 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search articles..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={() => handleSearch('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
