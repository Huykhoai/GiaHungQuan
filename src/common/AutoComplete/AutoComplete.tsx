import type { SxProps, Theme } from "@mui/material"
import { Autocomplete as AutocompleteMUI, TextField as TextFieldMUI, Paper, styled } from "@mui/material"
import React from "react"
import type { FieldError } from "react-hook-form";

const StyledPaper = styled(Paper)(() => ({
    borderRadius: '10px',
    marginTop: '8px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #f1f5f9',
    '& .MuiAutocomplete-listbox': {
        padding: '6px',
        '& .MuiAutocomplete-option': {
            borderRadius: '8px',
            margin: '2px 0',
            padding: '10px 14px',
            fontSize: '0.875rem',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&[aria-selected="true"]': {
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                color: '#6366f1',
                fontWeight: 600,
                '&.Mui-focused': {
                    backgroundColor: 'rgba(99, 102, 241, 0.12)',
                },
            },
            '&.Mui-focused': {
                backgroundColor: '#f8fafc',
            },
            '&:hover': {
                backgroundColor: '#f1f5f9',
                paddingLeft: '18px',
            },
        },
    },
}));

const StyledTextField = styled(TextFieldMUI)(() => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        backgroundColor: '#fff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: '0.875rem',
        '& fieldset': {
            borderColor: '#c8ced7ff',
            borderWidth: '1px',
        },
        '&:hover fieldset': {
            borderColor: '#94a3b8',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#6366f1',
            borderWidth: '1.5px',
            boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)',
        },
    },
    '& .MuiAutocomplete-input': {
        padding: '2px 4px !important',
        minHeight: '22.6px',
    },
}));

interface AutoCompleteProps<T> {
    options: T[];
    value: T | null;
    onChange: (event: React.SyntheticEvent, value: T | null) => void;
    placeholder: string;
    props?: SxProps<Theme>;
    className?: string;
    disabled?: boolean;
    error?: FieldError;
    getOptionLabel?: (option: T) => string;
    isOptionEqualToValue?: (option: T, value: T) => boolean;
}

const AutoComplete = <T extends { cid?: string; name?: string; id?: any }>({
    options = [],
    value = null,
    onChange,
    placeholder,
    props,
    className,
    error,
    disabled,
    getOptionLabel = (option: T) => (option?.cid ? `${option?.cid} - ${option?.name}` : option?.name) || "",
    isOptionEqualToValue = (option, val) => option.id === val?.id,
}: AutoCompleteProps<T>) => {
    return (
        <AutocompleteMUI
            className={className}
            options={options || []}
            getOptionLabel={getOptionLabel}
            size="small"
            value={value}
            onChange={onChange}
            PaperComponent={StyledPaper}
            fullWidth
            disabled={disabled}
            isOptionEqualToValue={isOptionEqualToValue}
            sx={{
                width: '100%',
                ...props,
                "& .MuiInputBase-root.Mui-disabled": {
                    backgroundColor: '#f8fafc',
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: '#94a3b8',
                    }
                }
            }}
            renderInput={(params) => (
                <StyledTextField
                    {...params}
                    placeholder={placeholder}
                    error={!!error}
                    helperText={error?.message}
                />
            )}
        />
    )
}

export default React.memo(AutoComplete) as typeof AutoComplete;
