package healthcheck

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestMain(m *testing.M) {
	os.Exit(m.Run())
}

var T_TestIdMethodMap = map[TestMethodId]HealthCheckMethod{
	1: mockTestMethod,
	2: mockTestMethodFail,
	3: mockTestMethodError,
}

var T_TestIdStringMap = map[string]TestMethodId{
	"TEST":  1,
	"TESTF": 2,
	"TESTE": 3,
}

func mockTestMethod(ctx context.Context, options HealthCheckMethodOptions) {
	options.StatusChannel <- &HealthCheckStatus{
		ServiceName: options.ServiceName,
		Status:      SERVICE_STATUS_REACHABLE,
		StatusCode:  200,
	}
}

func mockTestMethodFail(ctx context.Context, options HealthCheckMethodOptions) {
	options.StatusChannel <- &HealthCheckStatus{
		ServiceName: options.ServiceName,
		Status:      SERVICE_STATUS_NOT_REACHABLE,
		StatusCode:  500,
	}
}

func mockTestMethodError(ctx context.Context, options HealthCheckMethodOptions) {
	err := fmt.Errorf("Some Error Occured")
	options.ErrorChannel <- &err
}

func TestPerformHealthCheck(t *testing.T) {

	handler := HealthCheckHandler{
		TestIdMethodMap: T_TestIdMethodMap,
		TestIdStringMap: T_TestIdStringMap,
	}

	tests := []struct {
		Name             string
		ServiceName      string
		ServiceValue     string
		ExpectError      bool
		ExpectedResponse HealthCheckStatus
	}{
		{
			Name:         "Perform HealthCheck With Service Reachable",
			ExpectError:  false,
			ServiceName:  "SERVICE_TEST_WEB",
			ServiceValue: "web:9000",
			ExpectedResponse: HealthCheckStatus{
				ServiceName: "WEB",
				Status:      SERVICE_STATUS_REACHABLE,
				StatusCode:  200,
			},
		},
		{
			Name:         "Perform HealthCheck With Service Not Reachable",
			ExpectError:  false,
			ServiceName:  "SERVICE_TESTF_WEB",
			ServiceValue: "web:9000",
			ExpectedResponse: HealthCheckStatus{
				ServiceName: "WEB",
				Status:      SERVICE_STATUS_NOT_REACHABLE,
				StatusCode:  500,
			},
		},
		{
			Name:         "Perform HealthCheck With Service with Method Error",
			ExpectError:  false,
			ServiceName:  "SERVICE_TESTE_WEB",
			ServiceValue: "web:9000",
			ExpectedResponse: HealthCheckStatus{
				ServiceName: "WEB",
				Status:      SERVICE_STATUS_NOT_REACHABLE,
				StatusCode:  500,
			},
		},
		{
			Name:        "PerformHealthCheck With Undefined Test Method",
			ExpectError: true,
			ServiceName: "SERVICE_TESTC_WEB",
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			t.Setenv(tt.ServiceName, tt.ServiceValue)
			options := HealthCheckOptions{
				ConfirmTries:    3,
				MaxRetries:      1,
				TimeoutDuration: 5 * time.Second,
				RetryDuration:   1 * time.Second,
			}
			statusChannel, errorChannel := handler.PerformHealthCheck(ctx, options)
			statuses := make([]HealthCheckStatus, 0)
			errors := make([]error, 0)
			for {
				select {
				case status, ok := <-statusChannel:
					if !ok {
						statusChannel = nil
					} else {
						statuses = append(statuses, *status)
					}
				case err, ok := <-errorChannel:
					if !ok {
						errorChannel = nil
					} else {
						errors = append(errors, *err)
						cancel()
					}
				}
				if statusChannel == nil && errorChannel == nil {
					break
				}
			}

			if tt.ExpectError {
				if len(errorChannel) != 1 {
					assert.NotNil(t, errors[0])
				}
			} else {
				if len(statuses) != 1 {
					t.Fatalf("%s: expected statuses length 1, got %d", tt.Name, len(statuses))
				}
				if statuses[0] != tt.ExpectedResponse {
					t.Fatalf("%s:expected status %v, got %v", tt.Name, tt.ExpectedResponse, statuses[0])
				}
			}
		})
	}
}

func TestExecuteHealthCheckWithRetries(t *testing.T) {
	handler := &HealthCheckHandler{
		TestIdStringMap: T_TestIdStringMap,
		TestIdMethodMap: T_TestIdMethodMap,
	}
	healthCheckOptions := HealthCheckMethodOptions{
		ServiceName: "web",
		ServiceData: &ServiceData{
			HostName:   "localhost",
			Port:       "5000",
			Path:       "/",
			TestMethod: HTTP_TEST_METHOD,
		},
		MaxRetries:      2,
		ConfirmTries:    3,
		RetryDuration:   1 * time.Second,
		TimeoutDuration: 2 * time.Second,
	}

	ctx := context.Background()
	var wg = sync.WaitGroup{}
	statusChannel := make(chan *HealthCheckStatus)
	errorChannel := make(chan *error)

	wg.Add(1)
	go handler.ExecuteHealthCheckWithRetries(ctx, HttpHealthCheckMethod, healthCheckOptions, &wg, statusChannel, errorChannel)

	select {
	case status := <-statusChannel:
		t.Logf("Got result %v", status)
	case error := <-errorChannel:
		t.Errorf("Recieved error message (%v) from channel that is not expected", error)
	}
}

func TestAccumilatedHealthCheck(t *testing.T) {
	handler := &HealthCheckHandler{
		TestIdStringMap: T_TestIdStringMap,
		TestIdMethodMap: T_TestIdMethodMap,
	}

	ctx := context.Background()
	t.Setenv("SERVICE_TEST_WEB", "web:9000")
	t.Setenv("SERVICE_TESTF_API", "web:9000")

	expoectedAccStatus := AccHealthCheckStatus{
		Statuses: []*HealthCheckStatus{
			{
				ServiceName: "WEB",
				Status:      SERVICE_STATUS_REACHABLE,
				StatusCode:  200,
			},
			{
				ServiceName: "API",
				Status:      SERVICE_STATUS_NOT_REACHABLE,
				StatusCode:  500,
			},
		},
		Errors: []*error{},
	}

	options := HealthCheckOptions{
		ConfirmTries:    3,
		MaxRetries:      1,
		TimeoutDuration: 5 * time.Second,
		RetryDuration:   1 * time.Second,
	}

	accStatus := handler.GetAccumilatedHealthCheck(ctx, options)

	if len(accStatus.Statuses) != 2 {
		t.Fatalf("Expected 2 statuses, got %d", len(accStatus.Statuses))
	}

	if len(accStatus.Errors) != 0 {
		t.Fatalf("Expected 0 errors, got %d", len(accStatus.Errors))
	}

	for i, status := range accStatus.Statuses {
		if status.StatusCode != expoectedAccStatus.Statuses[i].StatusCode || status.ServiceName != expoectedAccStatus.Statuses[i].ServiceName || status.Status != expoectedAccStatus.Statuses[i].Status {
			t.Fatalf("Expected %v, got %v", expoectedAccStatus.Statuses[i], status)
		}
	}
}

// ------------- Test Helper Functions ---------------

func TestGetServiceFromEnvironment(t *testing.T) {
	handler := NewHealthCheckHandler()
	testServiceMap := map[string]string{
		"SERVICE_HTTP_WEB": "http://web:3000",
		"SERVICE_HTTP_API": "http://api:9000",
	}

	expectedServiceMap := make(map[string]string)
	for key, value := range testServiceMap {
		t.Setenv(key, value)
		key = strings.ReplaceAll(key, "SERVICE_", "")
		expectedServiceMap[key] = value
	}

	// Execute the GetServiceFromEnvironment to get the services
	actualServiceMap, err := handler.GetServiceFromEnvironment()
	assert.NoError(t, err)
	assert.ObjectsAreEqual(actualServiceMap, expectedServiceMap)
}

func TestParseKeyValue(t *testing.T) {
	handler := NewHealthCheckHandler()

	tests := []struct {
		Name        string
		ServiceKey  string
		ServiceUrl  string
		ExpectError bool
		Expected    *ServiceData
	}{
		{
			Name:       "Http Service Method",
			ServiceKey: "SERVICE_HTTP_WEB",
			ServiceUrl: "web:9000",
			Expected: &ServiceData{
				HostName:   "web",
				Port:       "9000",
				Path:       "/",
				TestMethod: HTTP_TEST_METHOD,
			},
		},
		{
			Name:       "TCP Service with path but without port",
			ServiceKey: "SERVICE_TCP_POSTGRES",
			ServiceUrl: "postgres/test",
			Expected: &ServiceData{
				HostName:   "postgres",
				Port:       "",
				Path:       "/test",
				TestMethod: TCP_TEST_METHOD,
			},
		},
		{
			Name:        "Incorrect Test Method Specified",
			ServiceKey:  "SERVICE_WRONG_WEB",
			ServiceUrl:  "web:9000",
			ExpectError: true,
		},
		{
			Name:        "Key without Service Name",
			ServiceKey:  "SERVICE_HTTP",
			ServiceUrl:  "web:9000",
			ExpectError: true,
		},
		{
			Name:        "No hostname provided",
			ServiceKey:  "SERVICE_HTTP_WEB",
			ServiceUrl:  ":9000",
			ExpectError: true,
		},
	}

	for _, tt := range tests {
		_, serviceData, err := handler.ParseKeyValue(tt.ServiceKey, tt.ServiceUrl)
		if tt.ExpectError {
			if err == nil {
				t.Errorf("%s: Expected Error but got nil with struct %+v", tt.Name, serviceData)
			}
		} else {
			if ok := assert.Nil(t, err); !ok {
				t.Errorf("%s: Expected Nil error but recived %v", tt.Name, err)
			}
			if ok := assert.ObjectsAreEqual(tt.Expected, serviceData); !ok {
				t.Errorf("%s: Expected %+v but recieved %+v", tt.Name, tt.Expected, serviceData)
			}
		}
	}
}
