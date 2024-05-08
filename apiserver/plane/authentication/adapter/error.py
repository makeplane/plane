AUTHENTICATION_ERROR_CODES = {
    # Global
    "INSTANCE_NOT_CONFIGURED": 5000,
    "INVALID_EMAIL": 5012,
    "EMAIL_REQUIRED": 5013,
    "SIGNUP_DISABLED": 5001,
    # Password strength
    "INVALID_PASSWORD": 5002,
    "SMTP_NOT_CONFIGURED": 5007,
    # Sign Up
    "USER_ALREADY_EXIST": 5003,
    "AUTHENTICATION_FAILED_SIGN_UP": 5006,
    "REQUIRED_EMAIL_PASSWORD_SIGN_UP": 5015,
    "INVALID_EMAIL_SIGN_UP": 5017,
    "INVALID_EMAIL_MAGIC_SIGN_UP": 5019,
    "MAGIC_SIGN_UP_EMAIL_CODE_REQUIRED": 5023,
    # Sign In
    "USER_DOES_NOT_EXIST": 5004,
    "AUTHENTICATION_FAILED_SIGN_IN": 5005,
    "REQUIRED_EMAIL_PASSWORD_SIGN_IN": 5014,
    "INVALID_EMAIL_SIGN_IN": 5016,
    "INVALID_EMAIL_MAGIC_SIGN_IN": 5018,
    "MAGIC_SIGN_IN_EMAIL_CODE_REQUIRED": 5022,
    # Both Sign in and Sign up
    "INVALID_MAGIC_CODE": 5008,
    "EXPIRED_MAGIC_CODE": 5009,
    # Oauth
    "GOOGLE_NOT_CONFIGURED": 5010,
    "GITHUB_NOT_CONFIGURED": 5011,
    "GOOGLE_OAUTH_PROVIDER_ERROR": 5021,
    "GITHUB_OAUTH_PROVIDER_ERROR": 5020,
    # Reset Password
    "INVALID_PASSWORD_TOKEN": 5024,
    "EXPIRED_PASSWORD_TOKEN": 5025,
    # Change password
    "INCORRECT_OLD_PASSWORD": 5026,
    "INVALID_NEW_PASSWORD": 5027,
    # set passowrd
    "PASSWORD_ALREADY_SET": 5028,
    # Admin
    "ADMIN_ALREADY_EXIST": 5029,
    "REQUIRED_ADMIN_EMAIL_PASSWORD_FIRST_NAME": 5030,
    "INVALID_ADMIN_EMAIL": 5031,
    "INVALID_ADMIN_PASSWORD": 5032,
    "REQUIRED_ADMIN_EMAIL_PASSWORD": 5033,
    "ADMIN_AUTHENTICATION_FAILED": 5034,
    "ADMIN_USER_ALREADY_EXIST": 5035,
    "ADMIN_USER_DOES_NOT_EXIST": 5036,
}


class AuthenticationException(Exception):

    error_code = None
    error_message = None
    payload = {}

    def __init__(self, error_code, error_message, payload={}):
        self.error_code = error_code
        self.error_message = error_message
        self.payload = payload

    def get_error_dict(self):
        error = {
            "error_code": self.error_code,
            "error_message": self.error_message,
        }
        for key in self.payload:
            error[key] = self.payload[key]

        return error
