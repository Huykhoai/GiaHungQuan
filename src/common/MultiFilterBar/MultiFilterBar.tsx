import { ArrowDropDown, ArrowDropUp, Close, ContentPasteSearch, FilterAlt, Forward, Search } from "@mui/icons-material";
import { Autocomplete, Box, IconButton, TextField, Tooltip } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import './MultiFilterBar.css';

export type FilterType = 'text' | 'select' | 'checkbox' | 'date' | 'number';

export interface FilterOption {
    id: number | string;
    label: string;
}

export interface FilterItem {
    key: string;
    label: string;
    type: FilterType;
    options?: FilterOption[];
}

interface MultiFilterBarProps {
    categories: FilterItem[];
    onFilterChange?: (values: Record<string, any>) => void;
    initialFilters?: Record<string, any>;
}

const MultiFilterBar: React.FC<MultiFilterBarProps> = ({ categories, onFilterChange, initialFilters }) => {
    const PRIMARY_COLOR = import.meta.env.VITE_PRIMARY_COLOR;
    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [filters, setFilters] = useState<Record<string, any>>({});
    const [hasDropdown, setHasDropdown] = useState<boolean>(false);
    const [shouldApplyFilters, setShouldApplyFilters] = useState<boolean>(false);
    const [searchValue, setSearchValue] = useState<string>('');
    const [showSuggest, setShowSuggest] = useState<boolean>(false);

    useEffect(() => {
        if (!initialFilters || Object.keys(initialFilters).length === 0) return;

        const newSelected: string[] = [];
        const newFilters: Record<string, any> = {};

        Object.entries(initialFilters).forEach(([key, value]) => {
            const category = categories.find(c => c.key === key);
            if (category) {
                newSelected.push(key);
                if (category.type === 'select' && category.options) {
                    const option = category.options.find(opt => String(opt.id) === String(value));
                    newFilters[key] = option || null;
                } else if (category.type === 'checkbox') {
                    newFilters[key] = value === 'true' || value === true;
                } else {
                    newFilters[key] = value;
                }
            }
        });

        if (newSelected.length > 0) {
            setSelectedCategories(newSelected);
            setFilters(newFilters);
        }
    }, [initialFilters, categories]);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const availableCategories = useMemo(() => {
        return categories.filter(category => !selectedCategories.includes(category.key));
    }, [categories, selectedCategories]);

    const handleSelectCategory = useCallback((category: FilterItem) => {
        setSelectedCategories((prev) => {
            if (!prev.includes(category.key)) {
                return [...prev, category.key]
            }
            return prev;
        })

        setFilters((prev) => {
            const newFilters = { ...prev };
            newFilters[category.key] = "";
            return newFilters;
        });
        setHasDropdown(false);
    }, []);

    const removeCategory = useCallback((key: string) => {
        setSelectedCategories((prev) => prev.filter((catId) => catId !== key));
        setFilters((prev) => {
            const newFilters = { ...prev };
            delete newFilters[key];
            return newFilters;
        })
    }, [])

    const handleClickSuggest = useCallback((key: string, value: any) => {
        setSelectedCategories((prev) =>
            prev.includes(key) ? prev : [...prev, key]
        );
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setSearchValue("");
        setShowSuggest(false);
    }, []);

    const handleFilterChange = useCallback((key: string, value: any) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value
        }))

    }, [])

    const computedFilterOutput = useMemo(() => {
        return Object.entries(filters).reduce((acc, [key, value]: [string, any]) => {
            const isValidKey = categories.some((c) =>
                c.key.includes("-") ? c.key.split("-").includes(key) : c.key === key);
            if (isValidKey && value !== "") {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>)
    }, [filters, categories])

    useEffect(() => {
        if (shouldApplyFilters && onFilterChange) {
            onFilterChange(computedFilterOutput);
            setShouldApplyFilters(false);
        }
    }, [shouldApplyFilters, onFilterChange, computedFilterOutput])

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setHasDropdown(false);
        }
    }, [])

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [handleClickOutside])

    const handleOnKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter") {
            setShouldApplyFilters((prev) => !prev);
        }
    }, [])

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
            }}>
            <Box className="search-bar" ref={dropdownRef} sx={{ gap: 0.3 }}>
                {categories.filter((category) => selectedCategories.includes(category.key))
                    .map((category) => (
                        <Box className="tag" key={category.key}>
                            {category.type === "select" ? (
                                <span style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                                    {category.label}: {" "}
                                    <Autocomplete
                                        options={category.options || []}
                                        getOptionLabel={(option) => option.label}
                                        value={filters[category.key] || null}
                                        onChange={(_, value) => handleFilterChange(category.key, value)}
                                        onKeyDown={handleOnKeyDown}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    disableUnderline: true,
                                                    style: {
                                                        border: "none",
                                                        background: "transparent",
                                                        fontSize: 13,
                                                        padding: 0
                                                    }
                                                }}
                                                variant="standard"
                                                className="tag-input"
                                                placeholder={category.label} />
                                        )}
                                        size="small"
                                        sx={{
                                            minWidth: '8vw',
                                            display: "inline-block",
                                            '& .MuiInputBase-root': {
                                                padding: '0 !important',
                                                height: 'auto',
                                            },
                                            '& .MuiInputBase-input': {
                                                padding: '0 4px !important',
                                                height: '20px',
                                            }
                                        }}
                                        disableClearable
                                        freeSolo={false}
                                        slotProps={{ listbox: { style: { fontSize: 13 } } }}
                                    />
                                </span>
                            ) : category.type === "checkbox" ? (
                                <label className="tag-checkbox me-2">
                                    <input
                                        type="checkbox"
                                        checked={!!filters[category.key]}
                                        onChange={(e) => handleFilterChange(category.key, e.target.checked)}
                                        onKeyDown={handleOnKeyDown} />
                                    {category.label}
                                </label>
                            ) : category.type === "date" ? (
                                <span style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                                    {category.label}: {" "}
                                    <input
                                        type="date"
                                        className="tag-input"
                                        value={filters[category.key] || ""}
                                        onChange={(e) => handleFilterChange(category.key, e.target.value)}
                                        onKeyDown={handleOnKeyDown}
                                        placeholder={category.label} />
                                </span>
                            ) : category.type === "number" ? (
                                <span style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                                    {category.label}: {" "}
                                    <input
                                        type="number"
                                        className="tag-input"
                                        value={filters[category.key] || ""}
                                        onChange={(e) => handleFilterChange(category.key, e.target.value)}
                                        onKeyDown={handleOnKeyDown}
                                        placeholder={category.label} />
                                </span>
                            ) : (
                                <span style={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                                    {category.label}: {" "}
                                    <input
                                        type="text"
                                        className="tag-input"
                                        value={filters[category.key] || ""}
                                        onChange={(e) => handleFilterChange(category.key, e.target.value)}
                                        onKeyDown={handleOnKeyDown}
                                        placeholder={category.label} />
                                </span>
                            )}
                            <Close fontSize="small" color="error" onClick={() => removeCategory(category.key)} />
                        </Box>
                    ))}
                <TextField
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchValue}
                    onChange={(e) => {
                        setSearchValue(e.target.value)
                        setShowSuggest(!!e.target.value)
                        setHasDropdown(false)
                    }}
                    onFocus={() => {
                        setShowSuggest(false)
                        setHasDropdown(true)
                    }}
                    size="small"
                    variant="standard"
                    sx={{
                        flex: 1,
                        minWidth: '10vw',
                        '& .MuiInputBase-root': {
                            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                            padding: '4px 0',
                        },
                        '& .MuiInputBase-input': {
                            padding: '4px 8px',
                        },
                        '& .MuiInput-underline:before, & .MuiInput-underline:after': {
                            display: 'none',
                        }
                    }}
                />
                <div className="dropdown-wrapper">
                    <button
                        className="dropdown-toggle"
                        onClick={() => setHasDropdown((prev) => !prev)}
                        aria-label="Toggle dropdown"
                        aria-expanded={hasDropdown}>
                        {hasDropdown ? <ArrowDropUp /> : <ArrowDropDown />}
                    </button>
                    {showSuggest && searchValue && (
                        <div className="dropdown">
                            <div
                                className="absolute z-10 w-full mt-1 max-h-72 overflow-y-auto bg-white border border-[#6366f1] rounded-md shadow-lg scrollbar-thin"
                                style={{
                                    left: 0,
                                    top: 0,
                                }}
                                role="listbox"
                                aria-label="Search suggest">
                                {categories
                                    .filter((cat) => cat.type === "text")
                                    .map((cat) => (
                                        <div
                                            key={cat.key}
                                            className="custom-item group flex items-center gap-2 px-3 py-2 text-sm text-[#2c2c2c] cursor-pointer rounded hover:bg-[#f0f4f7] hover:shadow-sm transition-all duration-150 ease-in-out"
                                            style={{
                                                cursor: "pointer",
                                            }}
                                            role="option"
                                            onClick={() => handleClickSuggest(cat.key, searchValue)}
                                        >
                                            <Forward
                                                fontSize="small"
                                                className="text-[#2c2c2c] group-hover:text-[#734966]"
                                                style={{ marginRight: "6px" }}
                                            />
                                            <span>
                                                Tìm kiếm <strong>{cat.label}</strong> cho: {" "}
                                                <em className="italic text-[#6b4a5a]">{searchValue}</em>
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                    {hasDropdown && !(showSuggest && searchValue) && (
                        <div className="dropdown">
                            <div className="dropdown-content">
                                <div className="dropdown-section">
                                    <div className="dropdown-section-header">
                                        <FilterAlt fontSize="small" /> Bộ lọc theo
                                    </div>
                                    {availableCategories
                                        .filter((cat) => ["select", "checkbox", "date"].includes(cat.type))
                                        .map((cat) => (
                                            <div
                                                key={cat.key}
                                                className="dropdown-item"
                                                onClick={() => handleSelectCategory(cat)}>
                                                {cat.label}
                                            </div>
                                        ))}
                                </div>
                                <div className="dropdown-section">
                                    <div className="dropdown-section-header">
                                        <ContentPasteSearch fontSize="small" /> Tìm kiếm theo
                                    </div>
                                    {availableCategories
                                        .filter((cat) => ["text", "number"].includes(cat.type))
                                        .map((cat) => (
                                            <div
                                                key={cat.key}
                                                className="dropdown-item"
                                                onClick={() => handleSelectCategory(cat)}>
                                                {cat.label}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Box>
            <div className="apply-container">
                <Tooltip title="Áp dụng bộ lọc">
                    <IconButton
                        onClick={() => setShouldApplyFilters((prev) => !prev)}
                        aria-label="Apply filters"
                        aria-expanded={shouldApplyFilters}
                        size="medium"
                        sx={{
                            backgroundColor: PRIMARY_COLOR,
                            borderRadius: "30%",
                            marginLeft: "2px",
                            color: "white",
                            "&:hover": {
                                backgroundColor: "#3A5FCD",
                            },
                        }}>
                        <Search sx={{ color: "white" }} />
                    </IconButton>
                </Tooltip>
            </div>
        </Box>
    )
};

export default React.memo(MultiFilterBar);