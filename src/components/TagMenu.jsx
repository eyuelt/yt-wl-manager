import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Palette, GitMerge } from 'lucide-react';

const TagMenu = ({ tag, color, onColorChange, onMergeClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleColorChange = (e) => {
        onColorChange(tag, e.target.value);
    };

    const handleMergeClick = () => {
        setIsOpen(false);
        onMergeClick(tag);
    };

    return (
        <div ref={menuRef} className="relative">
            {/* Triple-dot button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded transition-opacity z-10"
                title="Tag options"
            >
                <MoreVertical size={16} className="text-gray-400 hover:text-white" />
            </button>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    {/* Change Color */}
                    <div className="p-2">
                        <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded cursor-pointer transition-colors">
                            <Palette size={16} className="text-gray-400" />
                            <span className="text-white text-sm">Change Color</span>
                            <input
                                type="color"
                                value={color}
                                onChange={handleColorChange}
                                onClick={(e) => e.stopPropagation()}
                                className="ml-auto w-6 h-6 rounded cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-700" />

                    {/* Merge Tag */}
                    <div className="p-2">
                        <button
                            onClick={handleMergeClick}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded transition-colors text-left"
                        >
                            <GitMerge size={16} className="text-gray-400" />
                            <span className="text-white text-sm">Merge Into...</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagMenu;
