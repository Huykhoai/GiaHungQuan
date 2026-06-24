import React, { useEffect, useState } from "react";
interface TextFieldProps {
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    type?: React.HTMLInputTypeAttribute;
    isNumber?: boolean;
    props?: React.InputHTMLAttributes<HTMLInputElement>;
}
const TextField = ({ name, value, onChange, placeholder, props, disabled, type = "text", isNumber = false }: TextFieldProps) => {
    const [localValue, setLocalValue] = useState(value ?? '');

    useEffect(() => {
        setLocalValue(value ?? '');
    }, [value]);

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (onChange && e.target.value !== String(value ?? '')) {
            if (isNumber) {
                const regex = /^[+-]?([0-9]*[.])?[0-9]*$/;
                if (regex.test(e.target.value) && e.target.value !== "" && e.target.value !== "." && e.target.value !== "-" && e.target.value !== "+") {
                    let numValue = Number(e.target.value);
                    const min = props?.min !== undefined ? Number(props.min) : -Infinity;
                    const max = props?.max !== undefined ? Number(props.max) : Infinity;

                    if (numValue < min) numValue = min;
                    if (numValue > max) numValue = max;

                    const finalValue = String(numValue);
                    setLocalValue(finalValue);
                    onChange({ ...e, target: { ...e.target, value: finalValue } } as any);
                } else {
                    setLocalValue('0');
                    onChange({ ...e, target: { ...e.target, value: '0' } } as any);
                }
            } else {
                onChange(e);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <input
            {...props}
            type={type}
            name={name}
            className={`form-control ${props?.className || ''}`}
            value={localValue}
            onChange={handleOnChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
        />
    );
};
export default React.memo(TextField);