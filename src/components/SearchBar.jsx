import React from 'react';
import { Search, X } from 'lucide-react';
import { useVideoContext } from '../context/VideoContext';

const SearchBar = () => {
    const { searchQuery, setSearchQuery } = useVideoContext();

    const handleClear = () => {
        setSearchQuery('');
    };

    return (
        <div className="relative flex-1 max-w-2xl min-w-0">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-colors text-sm sm:text-base"
            />
            {searchQuery && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    aria-label="Clear search"
                >
                    <X size={20} />
                </button>
            )}
        </div>
    );
};

export default SearchBar;
