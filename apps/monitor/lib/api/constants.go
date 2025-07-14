package prime_api

type ErrorCode int

type APIError struct {
	Error   string
	Success bool
}

const (
	NO_ERROR ErrorCode = iota
	UNABLE_TO_POST_SERVICE_STATUS
	UNABLE_TO_GET_FEATURE_FLAGS
	UNABLE_TO_ACTIVATE_WORKSPACE
	UNABLE_TO_PARSE_FEATURE_FLAGS
	UNABLE_TO_SYNC_WORKSPACE
	UNABLE_TO_UPDATE_SEATS
	UNABLE_TO_FETCH_WORKSPACE_SUBSCRIPTION
	UNABLE_TO_RETRIEVE_PLANS
	UNABLE_TO_PARSE_PLANS
	UNABLE_TO_DEACTIVATE_LICENSE
)

var errorCodeMap = map[ErrorCode]string{
	NO_ERROR:                               "",
	UNABLE_TO_POST_SERVICE_STATUS:          "Unable to post service status",
	UNABLE_TO_GET_FEATURE_FLAGS:            "Unable to get feature flags",
	UNABLE_TO_PARSE_FEATURE_FLAGS:          "Unable to parse feature flags",
	UNABLE_TO_ACTIVATE_WORKSPACE:           "Unable to activate workspace, please check the logs",
	UNABLE_TO_SYNC_WORKSPACE:               "Unable to sync workspace, please check the logs",
	UNABLE_TO_UPDATE_SEATS:                 "Unable to update seats for the license subscription",
	UNABLE_TO_FETCH_WORKSPACE_SUBSCRIPTION: "Unable to fetch workspace subscription",
	UNABLE_TO_RETRIEVE_PLANS:               "Unable to retrieve plans",
	UNABLE_TO_PARSE_PLANS:                  "Unable to parse plans",
	UNABLE_TO_DEACTIVATE_LICENSE:           "Unable to activate license",
}

// Converting the Error Code type to confirm to the stringer interface to be
// used in error messages and print statements, ;)
func (code ErrorCode) String() string {
	return errorCodeMap[code]
}
