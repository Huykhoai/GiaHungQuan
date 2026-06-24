import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Select.css';

interface Option {
    label: string;
    value: string | number;
}

interface SelectProps {
    options: Option[];
    value?: string | number;
    onChangeSize: (value: string | number) => void;
    className?: string;
    disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChangeSize,
    className = '',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const handleToggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue: string | number) => {
        onChangeSize(optionValue);
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
                className="select-trigger"
                onClick={handleToggle}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <span className="selected-value">
                    {selectedOption ? selectedOption.label : ""}
                </span>
                <svg className="select-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>

            <div className="select-dropdown">
                <ul className="select-options-list" role="listbox">
                    {options.map((opt, idx) => {
                        const isSelected = opt.value === value;
                        return (
                            <li
                                key={idx}
                                className={`select-option-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSelect(opt.value)}
                                role="option"
                                aria-selected={isSelected}
                            >
                                <span className="option-label " style={{fontSize: 12}}>{opt.label}</span>
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

export default React.memo(Select);
