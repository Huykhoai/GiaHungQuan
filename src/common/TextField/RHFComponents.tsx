import { useFormContext, Controller } from "react-hook-form";
import TextField from "@/common/TextField/TextField";
import TextArea from "@/common/TextField/TextArea";
import AutoComplete from "@/common/AutoComplete/AutoComplete";

export const RHFTextField = ({ name, placeholder, props, disabled }: any) => {
    const { control } = useFormContext();
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value, name } }) => (
                <TextField
                    name={name}
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    props={props}
                    disabled={disabled}
                />
            )}
        />
    );
};

export const RHFTextArea = ({ name, placeholder, props, disabled }: any) => {
    const { control } = useFormContext();
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value, name } }) => (
                <TextArea
                    name={name}
                    value={value ?? ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    props={props}
                    disabled={disabled}
                />
            )}
        />
    );
};

export const RHFAutoComplete = ({ rules, name, options, placeholder, props, className, getOptionLabel, isOptionEqualToValue, onChangeCallback, disabled }: any) => {
    const { control } = useFormContext();
    return (
        <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <AutoComplete
                    className={className}
                    options={options}
                    value={value ?? null}
                    error={error}
                    onChange={(_, newValue) => {
                        onChange(newValue);
                        if (onChangeCallback) onChangeCallback(newValue);
                    }}
                    placeholder={placeholder}
                    props={props}
                    disabled={disabled}
                    getOptionLabel={getOptionLabel}
                    isOptionEqualToValue={isOptionEqualToValue}
                />
            )}
        />
    );
};
