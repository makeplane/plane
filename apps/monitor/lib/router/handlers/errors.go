package handlers

const (
	F_EITHER_ONE_VALUE_NOT_FOUND     = "either %v or %v, value not provided"
	INVALID_RECORD_TYPE_PROVIDED     = "invalid record type provided"
	UNABLE_TO_PERFORM_DNS_VALIDATION = "unable to perform dns validation, please try again later"
	F_EXPECTED_DNS_RECORD_NONE_FOUND = "expected DNS records for the provided domain %s, got none"
	RECORD_TYPES_NON_EMPTY           = "record types cannot be empty, pass a valid slice of record types"
)
