import * as React from 'react';
import { FC } from 'react';

declare type TButtonVariant = "primary" | "accent-primary" | "outline-primary" | "neutral-primary" | "link-primary" | "danger" | "accent-danger" | "outline-danger" | "link-danger" | "tertiary-danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: TButtonVariant;
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    disabled?: boolean;
    appendIcon?: any;
    prependIcon?: any;
    children: React.ReactNode;
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

declare const Spinner: React.FC;

export { Button, ButtonProps, Input, InputProps, RadialProgressBar, Spinner, TextArea, TextAreaProps };
