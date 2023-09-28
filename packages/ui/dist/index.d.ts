import * as React from 'react';

declare const Button: () => JSX.Element;

interface InputProps {
    type: string;
    id: string;
    value: string;
    name: string;
    onChange: () => void;
    className?: string;
    mode?: "primary" | "transparent" | "true-transparent";
    size?: "sm" | "md" | "lg";
    hasError?: boolean;
    placeholder?: string;
    disabled?: boolean;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

export { Button, Input, InputProps };
