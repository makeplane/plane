import * as React from 'react';
import { FC } from 'react';

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

interface TextAreaProps {
    id: string;
    name: string;
    placeholder?: string;
    value?: string;
    rows?: number;
    cols?: number;
    disabled?: boolean;
    onChange: () => void;
    mode?: "primary" | "transparent";
    hasError?: boolean;
    className?: string;
}
declare const TextArea: React.ForwardRefExoticComponent<TextAreaProps & React.RefAttributes<HTMLTextAreaElement>>;

interface IRadialProgressBar {
    progress: number;
}
declare const RadialProgressBar: FC<IRadialProgressBar>;

export { Button, Input, InputProps, RadialProgressBar, TextArea, TextAreaProps };
