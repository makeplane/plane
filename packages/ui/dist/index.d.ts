import * as React from 'react';
import { FC } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger";
    children: React.ReactNode;
    className?: string;
    loading?: boolean;
    size?: "sm" | "md" | "lg";
    outline?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    mode?: "primary" | "transparent" | "true-transparent";
    inputSize?: "sm" | "md";
    hasError?: boolean;
    className?: string;
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    mode?: "primary" | "transparent";
    hasError?: boolean;
    className?: string;
}
declare const TextArea: React.ForwardRefExoticComponent<TextAreaProps & React.RefAttributes<HTMLTextAreaElement>>;

interface IRadialProgressBar {
    progress: number;
}
declare const RadialProgressBar: FC<IRadialProgressBar>;

export { Button, ButtonProps, Input, InputProps, RadialProgressBar, TextArea, TextAreaProps };
