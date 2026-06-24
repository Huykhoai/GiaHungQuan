import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Select.css';
import type { ConfigLimitResponse as Option } from '@/types';



interface SelectProps {
    options: Option[];
    value?: Option | null;
    onChange: (value: Option) => void;
    className?: string;
    disabled?: boolean;
}

const SelectUltra: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    className = '',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.id === value?.id);

    const handleToggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue: Option) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, handleClickOutside]);

    return (
        <div
            className={`custom-select-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
            ref={containerRef}
        >
            <div
                className="select-trigger gap-1"
                onClick={handleToggle}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                style={{ minWidth: '10vw' }}
            >
                <span className="selected-value">
                    {selectedOption ? selectedOption.name : ""}
                </span>
                <svg className="select-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>

            <div className="select-dropdown">
                <ul className="select-options-list" role="listbox">
                    {options.map((opt, idx) => {
                        const isSelected = opt.id === value?.id;
                        return (
                            <li
                                key={idx}
                                className={`select-option-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelect(opt)}
                                role="option"
                                aria-selected={isSelected}
                            >
                                <span className="option-label " style={{fontSize: 12}}>{opt.name}</span>
                                {isSelected && (
                                    <svg className="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default React.memo(SelectUltra);
