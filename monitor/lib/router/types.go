package router

import (
	"fmt"
	"time"

	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/lib/logger"
)

type MonitorRouterOptions struct {
	Api               *prime_api.IPrimeMonitorApi
	Logger            *logger.Handler
	AppName           string
	PrintRoutes       bool
	Encoder           func(v interface{}) ([]byte, error)
	Decoder           func(data []byte, v interface{}) error
	DisableKeepAlive  bool
	ReduceMemoryUsage bool
	PrivateKey        string
}

type ErrorCode int

const (
	START_ERROR ErrorCode = iota
)

var ErrorCodeMsg = map[ErrorCode]string{
	START_ERROR: "Failed to start router exited",
}

// Encapsulating errors under RouterError Construct, use unwrap method to unwrap
// the error encapsulated inside RouterError
type RouterError struct {
	Operation string
	Message   string
	Code      ErrorCode
	Timestamp time.Time
	Err       error
}

func (e *RouterError) Error() string {
	return fmt.Sprintf("[%s] %s (code: %d) at %s: %v", e.Operation, e.Message, e.Code, e.Timestamp.Format(time.RFC3339), e.Err)
}

func (e *RouterError) Unwrap() error {
	return e.Err
}
