package healthcheck

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"strings"
	"time"
)

type HealthCheckMethodOptions struct {
	StatusChannel   chan *HealthCheckStatus
	ErrorChannel    chan *error
	ServiceName     string
	ServiceData     *ServiceData
	MaxRetries      int
	ConfirmTries    int
	TimeoutDuration time.Duration
	RetryDuration   time.Duration
}

type HealthCheckMethod func(context.Context, HealthCheckMethodOptions)

// ----------------------- Methods ------------------------------

// Performs healthcheck on the service provided in healthcheckoptions and
// streams the response over the given HealthCheckStatus Channel.
func HttpHealthCheckMethod(ctx context.Context, options HealthCheckMethodOptions) {
	select {
	case <-ctx.Done():
		return
	default:
		reachable, statusCode, err := ReportHttpCallStatus(options)
		if err != nil {
			options.ErrorChannel <- &err
		}
		health := &HealthCheckStatus{
			ServiceName: options.ServiceName,
		}
		if reachable {
			health.Status = SERVICE_STATUS_REACHABLE
			health.StatusCode = statusCode
		} else {
			health.Status = SERVICE_STATUS_NOT_REACHABLE
		}
		options.StatusChannel <- health
	}
}

// @Unimplemented
// Performs a healthcheck over services based on TCP and returns the response via a channel
// provided in the options parameter
func TcpHealthCheckMethod(ctx context.Context, options HealthCheckMethodOptions) {
	select {
	case <-ctx.Done():
		return
	default:
		// Attempt to establish a TCP connection to the Redis server
		conn, err := net.DialTimeout(
			"tcp",
			fmt.Sprintf("%s:%s", options.ServiceData.HostName, options.ServiceData.Port),
			options.TimeoutDuration,
		)

		if err != nil {
			return
		}

		// Close the connection if the connection exists
		defer func() {
			if conn != nil {
				conn.Close()
			}
		}()

		options.StatusChannel <- &HealthCheckStatus{
			ServiceName: options.ServiceName,
		}

	}
}

// ----------------------- Helpers -----------------------------
// Generates an http string from the HealthCheckMethodOptions and generates a
// url and returns the url as a string
func GetHttpUrlString(options HealthCheckMethodOptions) string {
	url := "http://" + options.ServiceData.HostName
	if options.ServiceData.Port != "" {
		url += ":" + options.ServiceData.Port
	}
	if !strings.HasPrefix(options.ServiceData.Path, "/") {
		options.ServiceData.Path = "/" + options.ServiceData.Path
	}
	url += options.ServiceData.Path
	return url
}

// Check if a status is valid or not, from 200 to 399, every status is
// considered as valid, others would be considered invalid
func IsValidStatus(statusCode int) bool {
	switch {
	case statusCode >= 200 && statusCode < 399:
		return true
	default:
		return false
	}
}

// Makes an API Call and Reports the status of the call
func ReportHttpCallStatus(options HealthCheckMethodOptions) (bool, int, error) {
	urlString := GetHttpUrlString(options)
	client := http.Client{
		Timeout: options.TimeoutDuration,
	}
	resp, err := client.Get(urlString)
	if err != nil {
		// If it's a timeout error we send the err as nil, as we want to represent
		// that the service is not reachable
		if os.IsTimeout(err) {
			return false, 0, nil
		}
		return false, 0, err
	}
	statusValid := IsValidStatus(resp.StatusCode)
	return statusValid, resp.StatusCode, nil
}

// Checks if a health check method should retry or not, based on the results of
// reachable (true) & not-reachable(false) statuses
func ShouldRetry(tryResults []bool) bool {
	trueCounts := 0
	for _, result := range tryResults {
		if result {
			trueCounts++
		}
	}

	lastVal := tryResults[len(tryResults)-1]

	if !lastVal {
		return true
	}

	if len(tryResults) > 1 {
		if tryResults[len(tryResults)-2] {
			return trueCounts < len(tryResults)/2
		} else {
			return true
		}
	}

	return false
}
