package healthcheck

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func TestHttpHealthCheckMethod(t *testing.T) {
	tests := []struct {
		name           string
		responseStatus int
		expectedStatus ServiceStatus
	}{
		{"Service Reachable", http.StatusOK, SERVICE_STATUS_REACHABLE},
		{"Service Not Reachable", http.StatusInternalServerError, SERVICE_STATUS_NOT_REACHABLE},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a local HTTP server
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tt.responseStatus)
			}))
			defer server.Close()

			// Set up channels and wait group
			statusChannel := make(chan *HealthCheckStatus, 1)
			errorChannel := make(chan *error, 1)

			serverURL := server.URL
			serverHostPort := strings.TrimPrefix(serverURL, "http://")
			hostPort := strings.Split(serverHostPort, ":")

			// Set up options
			options := HealthCheckMethodOptions{
				StatusChannel: statusChannel,
				ErrorChannel:  errorChannel,
				ServiceName:   "TestService",
				ServiceData: &ServiceData{
					HostName:   hostPort[0],
					Port:       hostPort[1],
					Path:       "/",
					TestMethod: HTTP_TEST_METHOD, // Assuming a default TestMethodId
				}}

			// Create a context with timeout
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			// Call the health check method
			go HttpHealthCheckMethod(ctx, options)

			// Verify the results
			select {
			case health := <-statusChannel:
				if health.Status != tt.expectedStatus {
					t.Errorf("%s:expected status %d, got %d", tt.name, tt.expectedStatus, health.Status)
				}
			case err := <-errorChannel:
				t.Errorf("%s: Unexpected error: %v", tt.name, *err)
			case <-time.After(5 * time.Second):
				t.Errorf("%s:test timed out", tt.name)
			}
		})
	}
}

func TestIsValidStatus(t *testing.T) {
	tests := []struct {
		Name     string
		Status   int
		Expected bool
	}{
		{
			Name:     "Status OK",
			Status:   200,
			Expected: true,
		},
		{
			Name:     "Status Redirect",
			Status:   300,
			Expected: true,
		},
		{
			Name:     "Status Not Reachable",
			Status:   400,
			Expected: false,
		},
		{
			Name:     "Status Server Error",
			Status:   500,
			Expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			status := IsValidStatus(tt.Status)
			if status != tt.Expected {
				t.Errorf("%s: For Status %d, expected %v but recieved %v", tt.Name, tt.Status, tt.Expected, status)
			}
		})
	}
}

func TestShouldRetry(t *testing.T) {

	tests := []struct {
		TryResults     []bool
		ExpectedResult bool
	}{
		{
			TryResults:     []bool{false, false, true},
			ExpectedResult: true,
		},
		{
			TryResults:     []bool{true, true, false},
			ExpectedResult: true,
		},
		{
			TryResults:     []bool{true},
			ExpectedResult: false,
		},
		{
			TryResults:     []bool{false},
			ExpectedResult: true,
		},
		{
			TryResults:     []bool{true, true, false, true},
			ExpectedResult: true,
		},
		{
			TryResults:     []bool{false, true, true, true},
			ExpectedResult: false,
		},
		{
			TryResults:     []bool{true, true, true, false},
			ExpectedResult: true,
		},
	}

	for index, tt := range tests {
		result := ShouldRetry(tt.TryResults)
		if result != tt.ExpectedResult {
			t.Errorf("For case %d, expected result %v but got %v", index, tt.ExpectedResult, result)
		}
	}
}
