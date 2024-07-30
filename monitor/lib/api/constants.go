package prime_api

type ErrorCode int

const (
	NO_ERROR ErrorCode = iota
	UNABLE_TO_POST_SERVICE_STATUS
)

var errorCodeMap = map[ErrorCode]string{
	NO_ERROR:                      "",
	UNABLE_TO_POST_SERVICE_STATUS: "Unable to post service status",
}

// Converting the Error Code type to confirm to the stringer interface to be
// used in error messages and print statements, ;)
func (code ErrorCode) String() string {
	return errorCodeMap[code]
}
