import zxcvbn from "zxcvbn";

export const isPasswordCriteriaMet = (password: string) => {
  const criteria = [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[!@#$%^&*]/.test(password)];

  return criteria.every((criterion) => criterion);
};

export const getPasswordStrength = (password: string) => {
  if (password.length === 0) return 0;
  if (password.length < 8) return 1;
  if (!isPasswordCriteriaMet(password)) return 2;

  const result = zxcvbn(password);
  return result.score;
};
