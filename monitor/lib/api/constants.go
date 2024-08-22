package prime_api

type ErrorCode int

const (
	NO_ERROR ErrorCode = iota
	UNABLE_TO_POST_SERVICE_STATUS
	UNABLE_TO_GET_FEATURE_FLAGS
	UNABLE_TO_ACTIVATE_WORKSPACE
	UNABLE_TO_PARSE_FEATURE_FLAGS
	UNABLE_TO_SYNC_WORKSPACE
)

var errorCodeMap = map[ErrorCode]string{
	NO_ERROR:                      "",
	UNABLE_TO_POST_SERVICE_STATUS: "Unable to post service status",
	UNABLE_TO_GET_FEATURE_FLAGS:   "Unable to get feature flags",
	UNABLE_TO_PARSE_FEATURE_FLAGS: "Unable to parse feature flags",
	UNABLE_TO_ACTIVATE_WORKSPACE:  "Unable to activate workspace, please check the logs",
	UNABLE_TO_SYNC_WORKSPACE:      "Unable to sync workspace, please check the logs",
}

// Converting the Error Code type to confirm to the stringer interface to be
// used in error messages and print statements, ;)
func (code ErrorCode) String() string {
	return errorCodeMap[code]
}
