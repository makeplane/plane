import zxcvbn from "zxcvbn";

export enum E_PASSWORD_STRENGTH {
  EMPTY = "empty",
  LENGTH_NOT_VALID = "length_not_valid",
  STRENGTH_NOT_VALID = "strength_not_valid",
  STRENGTH_VALID = "strength_valid",
}

const PASSWORD_MIN_LENGTH = 8;
// const PASSWORD_NUMBER_REGEX = /\d/;
// const PASSWORD_CHAR_CAPS_REGEX = /[A-Z]/;
// const PASSWORD_SPECIAL_CHAR_REGEX = /[`!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?~ ]/;

export const PASSWORD_CRITERIA = [
  {
    key: "min_8_char",
    label: "Min 8 characters",
    isCriteriaValid: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  // {
  //   key: "min_1_upper_case",
  //   label: "Min 1 upper-case letter",
  //   isCriteriaValid: (password: string) => PASSWORD_NUMBER_REGEX.test(password),
  // },
  // {
  //   key: "min_1_number",
  //   label: "Min 1 number",
  //   isCriteriaValid: (password: string) => PASSWORD_CHAR_CAPS_REGEX.test(password),
  // },
  // {
  //   key: "min_1_special_char",
  //   label: "Min 1 special character",
  //   isCriteriaValid: (password: string) => PASSWORD_SPECIAL_CHAR_REGEX.test(password),
  // },
];

export const getPasswordStrength = (password: string): E_PASSWORD_STRENGTH => {
  let passwordStrength: E_PASSWORD_STRENGTH = E_PASSWORD_STRENGTH.EMPTY;

  if (!password || password === "" || password.length <= 0) {
    return passwordStrength;
  }

  if (password.length >= PASSWORD_MIN_LENGTH) {
    passwordStrength = E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID;
  } else {
    passwordStrength = E_PASSWORD_STRENGTH.LENGTH_NOT_VALID;
    return passwordStrength;
  }

  const passwordCriteriaValidation = PASSWORD_CRITERIA.map((criteria) => criteria.isCriteriaValid(password)).every(
    (criterion) => criterion
  );
  const passwordStrengthScore = zxcvbn(password).score;

  if (passwordCriteriaValidation === false || passwordStrengthScore <= 2) {
    passwordStrength = E_PASSWORD_STRENGTH.STRENGTH_NOT_VALID;
    return passwordStrength;
  }

  if (passwordCriteriaValidation === true && passwordStrengthScore >= 3) {
    passwordStrength = E_PASSWORD_STRENGTH.STRENGTH_VALID;
  }

  return passwordStrength;
};
