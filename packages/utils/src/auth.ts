import zxcvbn from "zxcvbn";
import { E_PASSWORD_STRENGTH, PASSWORD_CRITERIA, PASSWORD_MIN_LENGTH } from "@plane/constants";

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
