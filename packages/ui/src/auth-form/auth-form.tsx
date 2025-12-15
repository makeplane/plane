import React, { useState, useMemo } from "react";
import { E_PASSWORD_STRENGTH } from "@plane/constants";
import { Button } from "../button/button";
import { Spinner } from "../spinners/circular-spinner";
import { cn } from "../utils";
import { AuthConfirmPasswordInput } from "./auth-confirm-password-input";
import { AuthForgotPassword } from "./auth-forgot-password";
import { AuthInput } from "./auth-input";
import { AuthPasswordInput } from "./auth-password-input";

export type AuthMode = "sign-in" | "sign-up";

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthFormProps {
  mode: AuthMode;
  initialData?: Partial<AuthFormData>;
  onSubmit?: (data: AuthFormData) => void;
  onForgotPassword?: () => void;
  onModeChange?: (mode: AuthMode) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  showForgotPassword?: boolean;
  showPasswordStrength?: boolean;
  emailError?: string;
  passwordError?: string;
  confirmPasswordError?: string;
  submitButtonText?: string;
  alternateModeText?: string;
  alternateModeButtonText?: string;
}

export function AuthForm({
  mode,
  initialData = {},
  onSubmit,
  onForgotPassword,
  onModeChange,
  loading = false,
  disabled = false,
  className = "",
  showForgotPassword = true,
  showPasswordStrength = true,
  emailError,
  passwordError,
  confirmPasswordError,
  submitButtonText,
  alternateModeText,
  alternateModeButtonText,
}: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: initialData.email || "",
    password: initialData.password || "",
    confirmPassword: initialData.confirmPassword || "",
  });

  const [passwordStrength, setPasswordStrength] = useState<E_PASSWORD_STRENGTH>(E_PASSWORD_STRENGTH.EMPTY);
  const [_passwordsMatch, setPasswordsMatch] = useState(false);

  const handleInputChange = (field: keyof AuthFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handlePasswordChange = (password: string) => {
    setFormData((prev) => ({
      ...prev,
      password,
    }));
  };

  const handlePasswordStrengthChange = (strength: E_PASSWORD_STRENGTH) => {
    setPasswordStrength(strength);
  };

  const handleConfirmPasswordChange = (matches: boolean) => {
    setPasswordsMatch(matches);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && isFormValid) {
      onSubmit(formData);
    }
  };

  const handleModeChange = () => {
    const newMode = mode === "sign-in" ? "sign-up" : "sign-in";
    onModeChange?.(newMode);
  };

  const isFormValid = useMemo(() => {
    const hasEmail = formData.email.length > 0;
    const hasPassword = formData.password.length > 0;

    if (mode === "sign-in") {
      return hasEmail && hasPassword && !loading && !disabled;
    } else {
      const isPasswordStrong = passwordStrength === E_PASSWORD_STRENGTH.STRENGTH_VALID;
      const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;
      return hasEmail && hasPassword && isPasswordStrong && passwordsMatch && !loading && !disabled;
    }
  }, [mode, formData, passwordStrength, loading, disabled]);

  const getSubmitButtonText = () => {
    if (submitButtonText) return submitButtonText;
    return mode === "sign-in" ? "Sign In" : "Create Account";
  };

  const getAlternateModeText = () => {
    if (alternateModeText) return alternateModeText;
    return mode === "sign-in" ? "Don't have an account?" : "Already have an account?";
  };

  const getAlternateModeButtonText = () => {
    if (alternateModeButtonText) return alternateModeButtonText;
    return mode === "sign-in" ? "Sign Up" : "Sign In";
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {/* Email Input */}
      <AuthInput
        id="email"
        name="email"
        type="email"
        label="Email"
        value={formData.email}
        onChange={handleInputChange("email")}
        placeholder="name@company.com"
        error={emailError}
        disabled={disabled}
        // autoComplete="email"
        required
      />

      {/* Password Input */}
      <AuthPasswordInput
        id="password"
        name="password"
        label={mode === "sign-in" ? "Password" : "Set a password"}
        value={formData.password}
        onChange={handleInputChange("password")}
        onPasswordChange={handlePasswordChange}
        onPasswordStrengthChange={handlePasswordStrengthChange}
        placeholder="Enter password"
        error={passwordError}
        showPasswordStrength={showPasswordStrength && mode === "sign-up"}
        disabled={disabled}
        // autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
        required
      />

      {/* Confirm Password Input (Sign Up Only) */}
      {mode === "sign-up" && (
        <AuthConfirmPasswordInput
          id="confirmPassword"
          name="confirmPassword"
          password={formData.password}
          value={formData.confirmPassword}
          onChange={handleInputChange("confirmPassword")}
          onPasswordMatchChange={handleConfirmPasswordChange}
          error={confirmPasswordError}
          disabled={disabled}
          // autoComplete="new-password"
          required
        />
      )}

      {/* Forgot Password Link (Sign In Only) */}
      {mode === "sign-in" && showForgotPassword && (
        <div className="flex justify-end">
          <AuthForgotPassword onForgotPassword={onForgotPassword} disabled={disabled} />
        </div>
      )}

      {/* Submit Button */}
      <div className="space-y-2.5">
        <Button type="submit" variant="primary" className="w-full" size="lg" disabled={!isFormValid} loading={loading}>
          {loading ? <Spinner height="20px" width="20px" /> : getSubmitButtonText()}
        </Button>

        {/* Alternate Mode Button */}
        {onModeChange && (
          <div className="text-center">
            <span className="text-13 text-tertiary">{getAlternateModeText()}</span>
            <button
              type="button"
              onClick={handleModeChange}
              className="ml-1 text-13 text-accent-primary hover:text-accent-secondary transition-colors duration-200"
              disabled={disabled}
            >
              {getAlternateModeButtonText()}
            </button>
          </div>
        )}
      </div>
    </form>
  );
}
