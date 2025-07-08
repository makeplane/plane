package healthcheck

// --------------------- CONSTANTS ---------------------

// PREFIX_METHOD_NAME
var (
	BLOCK_PART_LENGTH = 3
	PARSE_DELIMITER   = "_"
)

type TestMethodId int

// TEST METHODS
const (
	HTTP_TEST_METHOD TestMethodId = iota
	TCP_TEST_METHOD
)

// Provides a method to parse the TestMethodId from Strings
var TestIdStringMap = map[string]TestMethodId{
	"HTTP": HTTP_TEST_METHOD,
	"TCP":  TCP_TEST_METHOD,
}

type ServiceStatus int

const (
	SERVICE_STATUS_REACHABLE     ServiceStatus = iota
	SERVICE_STATUS_NOT_REACHABLE ServiceStatus = iota
)

var TestIdMethodMap = map[TestMethodId]HealthCheckMethod{
	HTTP_TEST_METHOD: HttpHealthCheckMethod,
	TCP_TEST_METHOD:  TcpHealthCheckMethod,
}

// ----------------------- ERRORS -----------------------
var (
	INVALID_KEY_BLOCK_LEN      = "The key passed is not valid, as there are lesser blocks than required."
	F1_INVALID_VALUE_BLOCK_LEN = "The value passed for key (%s) is invalid, as there are lesser blocks than required."

	F1_INVALID_TEST_ID           = "The test Id (%s) does not match any available test strategy yet."
	F2_TEST_METHOD_DOESNOT_EXIST = "The test strategy (%d) for the particular service (%s) doesnot exist yet."
	HOSTNAME_ABSENT              = "Expecting a hostname, but none provided"
)
