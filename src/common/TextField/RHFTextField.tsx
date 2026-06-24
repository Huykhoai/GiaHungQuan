import { TextField, type SxProps, type Theme } from "@mui/material";
import React, { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form"
interface RHFTextFieldProps {
    name: string;
    type?: React.HTMLInputTypeAttribute;
    label?: string;
    placeholder?: string;
    rules?: Record<string, any>;
    variant?: "outlined" | "filled" | "standard";
    fullWidth?: boolean;
    disabled?: boolean;
    isNumber?: boolean;
    multiline?: boolean;
    rows?: number;
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
    props?: SxProps<Theme>
}
export const RHFTextField = ({
    name, type = 'text', label, placeholder, rules, variant = "outlined", fullWidth = true,
    disabled, isNumber = false, multiline, rows, startAdornment, endAdornment, props
}: RHFTextFieldProps) => {
    const { control } = useFormContext();
    const externalValue = useWatch({ control, name });
    const [localValue, setLocalValue] = useState(externalValue ?? '');

    React.useEffect(() => {
        setLocalValue(externalValue ?? '');
    }, [externalValue]);

    const handleOnBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
        value: string,
        onChange: (value: string) => void,
        onBlur: () => void
    ) => {
        let finalValue = e.target.value;
        if (isNumber) {
            const regex = /^[+-]?([0-9]*[.])?[0-9]*$/;
            if (regex.test(finalValue) && finalValue !== "" && finalValue !== "." && finalValue !== "-" && finalValue !== "+") {
                onChange(finalValue);
            } else {
                setLocalValue('0');
                onChange({ ...e, target: { ...e.target, value: '0' } } as any);
            }
        }

        if (finalValue !== String(value ?? '')) {
            onChange(finalValue);
        }
        onBlur();
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !multiline) {
            e.currentTarget.blur();
        }
    };

    return (
        <Controller
            name={name}
            rules={rules}
            control={control}
            render={({ field: { onChange, onBlur, value, ...field }, fieldState: { error } }) => (
                <TextField
                    {...field}
                    type={type}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={(e) => handleOnBlur(e, value, onChange, onBlur)}
                    onKeyDown={(e) => handleKeyDown(e as any)}
                    label={label}
                    placeholder={placeholder}
                    size="small"
                    variant={variant}
                    fullWidth={fullWidth}
                    disabled={disabled}
                    error={!!error}
                    helperText={error?.message}
                    multiline={multiline}
                    rows={rows}
                    slotProps={{
                        input: {
                            startAdornment,
                            endAdornment,
                            sx: { borderRadius: '10px', fontSize: '0.875rem' }
                        }
                    }}
                    sx={{
                        width: '100%',
                        ...props,
                        "& .MuiInputBase-root.Mui-disabled": {
                            backgroundColor: '#f8fafc',
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: '#94a3b8',
                            }
                        },
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontSize: '0.875rem',
                            py: 1,
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
                        }
                    }}
                />
            )}
        />
    );
};