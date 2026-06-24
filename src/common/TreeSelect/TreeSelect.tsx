import React, { useState, useRef, useEffect } from 'react';
import './TreeSelect.css';

interface ConfigCategoryItem {
    name: string;
    url: string;
}

interface ConfigCategory {
    name: string;
    items: ConfigCategoryItem[];
}

interface TreeSelectProps {
    data: ConfigCategory[];
    placeholder?: string;
    onSelect?: (item: ConfigCategoryItem) => void;
    value?: ConfigCategoryItem | null;
}

const TreeSelect: React.FC<TreeSelectProps> = ({ data, placeholder = "Chọn danh mục", onSelect, value }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(0);
    const [selectedItem, setSelectedItem] = useState<ConfigCategoryItem | null>(value || null);

    useEffect(() => {
        if (value !== undefined) {
            setSelectedItem(value);
        }
    }, [value]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (item: ConfigCategoryItem) => {
        setSelectedItem(item);
        setIsOpen(false);
        if (onSelect) onSelect(item);
    };

    return (
        <div className="tree-select-container" ref={containerRef}>
            <div
                className={`tree-select-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedItem ? selectedItem.name : placeholder}</span>
                <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    style={{ marginLeft: 'auto', transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>

            {isOpen && (
                <div className="tree-dropdown-content">
                    <div className="tree-categories-col">
                        {data.map((category, idx) => (
                            <div
                                key={idx}
                                className={`tree-cat-item ${activeCategoryIndex === idx ? 'active' : ''}`}
                                onMouseEnter={() => setActiveCategoryIndex(idx)}
                            >
                                {category.name}
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        ))}
                    </div>

                    <div className="tree-items-col">
                        {data[activeCategoryIndex]?.items.map((item, idx) => (
                            <div
                                key={idx}
                                className="tree-sub-item"
                                onClick={() => handleItemClick(item)}
                            >
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(TreeSelect);
