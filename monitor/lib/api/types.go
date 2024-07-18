package prime_api

type StatusErrorCode int

const (
	NotReachable StatusErrorCode = iota
	ReachableWithNotOkStatus
)

type StatusMeta struct {
	Message    string          `json:"message"`
	Code       StatusErrorCode `json:"code"`
	StatusCode int             `json:"status_code"`
	Reachable  int             `json:"reachable"`
}

type StatusPayload struct {
	Version string                `json:"version"`
	Status  map[string]string     `json:"status"`
	Meta    map[string]StatusMeta `json:"meta"`
}
