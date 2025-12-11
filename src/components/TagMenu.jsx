import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, Palette, GitMerge } from 'lucide-react';

const PRESET_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#84CC16', // Lime
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
];

const TagMenu = ({ tag, color, onColorChange, onMergeClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
                setShowCustomPicker(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Reset custom picker when menu closes
    useEffect(() => {
        if (!isOpen) {
            setShowCustomPicker(false);
        }
    }, [isOpen]);

    const handleColorChange = (e) => {
        onColorChange(tag, e.target.value);
    };

    const handleMergeClick = () => {
        setIsOpen(false);
        onMergeClick(tag);
    };

    const dropdownMenu = (
        <div
            ref={menuRef}
            className="fixed w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-[9999]"
            style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
            }}
        >
            {/* Change Color */}
            <div className="p-3">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <Palette size={16} className="text-gray-400" />
                    <span className="text-white text-sm font-medium">Change Color</span>
                </div>

                {!showCustomPicker ? (
                    <>
                        {/* Preset color grid */}
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            {PRESET_COLORS.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onColorChange(tag, presetColor);
                                    }}
                                    className={`w-full h-8 rounded border-2 transition-all ${
                                        color.toUpperCase() === presetColor.toUpperCase()
                                            ? 'border-white scale-110'
                                            : 'border-gray-600 hover:border-gray-400'
                                    }`}
                                    style={{ backgroundColor: presetColor }}
                                    title={presetColor}
                                />
                            ))}
                        </div>
                        {/* Custom color button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCustomPicker(true);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm text-white"
                        >
                            <Palette size={14} />
                            Custom Color
                        </button>
                    </>
                ) : (
                    <>
                        {/* Custom color picker */}
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="color"
                                value={color}
                                onChange={handleColorChange}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full h-10 rounded cursor-pointer"
                            />
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCustomPicker(false);
                            }}
                            className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-sm text-white"
                        >
                            Back to Presets
                        </button>
                    </>
                )}
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
    );

    return (
        <>
            {/* Triple-dot button */}
            <button
                ref={buttonRef}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isOpen && buttonRef.current) {
                        const rect = buttonRef.current.getBoundingClientRect();
                        setMenuPosition({
                            top: rect.top + rect.height / 2 - 60, // Center vertically, adjust for menu height
                            right: window.innerWidth - rect.left + 8, // 8px gap from button
                        });
                    }
                    setIsOpen(!isOpen);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-700 rounded transition-opacity z-10"
                title="Tag options"
            >
                <MoreVertical size={16} className="text-gray-400 hover:text-white" />
            </button>

            {/* Render dropdown menu using portal */}
            {isOpen && createPortal(dropdownMenu, document.body)}
        </>
    );
};

export default TagMenu;
