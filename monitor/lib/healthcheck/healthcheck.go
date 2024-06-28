package healthcheck

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"
)

// Struct Exposed for interacting with the Healthcheck services
type HealthCheckHandler struct {
	TestIdMethodMap map[TestMethodId]HealthCheckMethod
	TestIdStringMap map[string]TestMethodId
}

func NewHealthCheckHandler() *HealthCheckHandler {
	return &HealthCheckHandler{
		TestIdMethodMap: TestIdMethodMap,
		TestIdStringMap: TestIdStringMap,
	}
}

// --------------------Utility Types---------------------------
type HealthCheckOptions struct {
	// Max Retries is the number of retries after one iteration of the
	// confirmation tries
	MaxRetries int
	// Confirm Tries is the number of tries made to confirm if a service can be
	// considered healthy
	ConfirmTries    int
	RetryDuration   time.Duration
	TimeoutDuration time.Duration
}

type HealthCheckStatus struct {
	ServiceName string
	Status      ServiceStatus
	StatusCode  int
}

type ServiceData struct {
	HostName   string
	Port       string
	Path       string
	TestMethod TestMethodId
}

// ------------------ Controller Methods ----------------------

// Performs Health Check and returns the status of the services as channels
func (h *HealthCheckHandler) PerformHealthCheck(ctx context.Context, options HealthCheckOptions) (chan *HealthCheckStatus, chan *error) {
	select {
	// return the function in case the context is cancelled
	case <-ctx.Done():
		return nil, nil
	default:
		_, cancel := context.WithCancel(ctx)

		// channels responsible for transmitting the final status of the services
		statusChannel := make(chan *HealthCheckStatus)
		errorChannel := make(chan *error)

		go func() {
			// Get the Service data from the environment
			serviceMap, err := h.GetServiceFromEnvironment()
			if err != nil {
				errorChannel <- &err
			}

			// Implement the Test Methods for each of the service recieved
			wg := &sync.WaitGroup{}

			for serviceName, props := range serviceMap {
				testMethod, ok := h.TestIdMethodMap[props.TestMethod]
				if !ok {
					cancel()
					err := fmt.Errorf(F2_TEST_METHOD_DOESNOT_EXIST, props.TestMethod, serviceName)
					errorChannel <- &err
				} else {
					wg.Add(1)
					// only implement wait group when the test method exist
					healthCheckOptions := HealthCheckMethodOptions{
						ServiceName:     serviceName,
						ServiceData:     props,
						MaxRetries:      options.MaxRetries,
						ConfirmTries:    options.ConfirmTries,
						RetryDuration:   options.RetryDuration,
						TimeoutDuration: options.TimeoutDuration,
					}
					// Added 1 for waiting for each HealthCheckExecution
					go h.ExecuteHealthCheckWithRetries(ctx, testMethod, healthCheckOptions, wg, statusChannel, errorChannel)
				}
			}

			wg.Wait()
			close(statusChannel)
			close(errorChannel)
		}()

		return statusChannel, errorChannel
	}
}

type AccHealthCheckStatus struct {
	Statuses []*HealthCheckStatus
	Errors   []*error
}

// Uses the Perform Health Check to get the status of the services, accumilates
// them and return to the consumer as a list of HealthCheckStatus
func (h *HealthCheckHandler) GetAccumilatedHealthCheck(ctx context.Context, options HealthCheckOptions) AccHealthCheckStatus {

	accStatusChan := make(chan AccHealthCheckStatus)
	defer close(accStatusChan)

	go func(ctx context.Context) {
		statusChannel, errorChannel := h.PerformHealthCheck(ctx, options)

		statuses := make([]*HealthCheckStatus, 0)
		errors := make([]*error, 0)
		for {
			select {
			case status, ok := <-statusChannel:
				if !ok {
					statusChannel = nil
				} else {
					statuses = append(statuses, status)
				}
			case err, ok := <-errorChannel:
				if !ok {
					errorChannel = nil
				} else {
					errors = append(errors, err)
				}
			}
			if statusChannel == nil && errorChannel == nil {
				break
			}
		}

		// Pass the accumilated status and errors to the channels
		accStatusChan <- AccHealthCheckStatus{
			Statuses: statuses,
			Errors:   errors,
		}
	}(ctx)

	select {
	case <-ctx.Done():
		return AccHealthCheckStatus{
			Statuses: []*HealthCheckStatus{},
			Errors:   nil,
		}
	case statuses := <-accStatusChan:
		return statuses
	}
}

func (h *HealthCheckHandler) ExecuteHealthCheckWithRetries(
	ctx context.Context,
	testMethod HealthCheckMethod,
	options HealthCheckMethodOptions,
	wg *sync.WaitGroup, statusChannel chan *HealthCheckStatus, errorChannel chan *error) {

	done := make(chan bool)

	// Perform the health check method and return the status to the status channel
	go func() {
		healthy := false
		defer wg.Done()

		// channels for recieving the frequent updates from the healthcheck channels,
		// we will run the operations over these channels, and decide weather we
		// should send a final status to user or not
		methodStatusChannel := make(chan *HealthCheckStatus)
		methodErrorChannel := make(chan *error)

		options.StatusChannel = methodStatusChannel
		options.ErrorChannel = methodErrorChannel

		failureStatus := 0

		for retry := 0; retry < options.MaxRetries; retry++ {
			testResults := make([]bool, 0)
			// iterating through a boolean array b
			for b := 0; b < options.ConfirmTries; b++ {
				go testMethod(ctx, options)
				select {
				case status := <-methodStatusChannel:
					testResults = append(testResults, status.Status == SERVICE_STATUS_REACHABLE)
					if status.Status != SERVICE_STATUS_REACHABLE {
						failureStatus = status.StatusCode
					}
				case <-methodErrorChannel:
					testResults = append(testResults, false)
				}
				time.Sleep(options.RetryDuration)
			}

			healthy = !ShouldRetry(testResults)
			if healthy {
				break
			}
		}

		if healthy {
			statusChannel <- &HealthCheckStatus{
				ServiceName: options.ServiceName,
				Status:      SERVICE_STATUS_REACHABLE,
				StatusCode:  200,
			}
		} else {
			if failureStatus == 0 {
				failureStatus = 500
			}
			statusChannel <- &HealthCheckStatus{
				ServiceName: options.ServiceName,
				Status:      SERVICE_STATUS_NOT_REACHABLE,
				StatusCode:  500,
			}
		}

		done <- true
	}()

	// Handle the context cancellation and the done channel
	select {
	case <-ctx.Done():
		return
	case <-done:
		return
	}
}

// -------------------- Helper Methods ------------------------

// Provides a map of service corresponding to the data corresponing to that
func (h *HealthCheckHandler) GetServiceFromEnvironment() (map[string]*ServiceData, error) {
	serviceMap := make(map[string]*ServiceData)
	envVars := GetEnvironmentVarMap()

	for key, value := range envVars {
		// Only take the services which has SERVICE_ prefix in front of them
		if strings.HasPrefix(key, "SERVICE_") {
			key, value, err := h.ParseKeyValue(key, value)
			if err != nil {
				return nil, err
			}
			serviceMap[key] = value
		}
	}

	return serviceMap, nil
}

// Parse the key and the value and returns the parsed blocks
func (h *HealthCheckHandler) ParseKeyValue(key string, value string) (string, *ServiceData, error) {
	blocks := strings.Split(key, PARSE_DELIMITER)
	if len(blocks) < BLOCK_PART_LENGTH {
		return "", nil, fmt.Errorf(INVALID_KEY_BLOCK_LEN)
	}

	// ------------ Parsing the Key ------------------------
	serviceName := blocks[BLOCK_PART_LENGTH-1]
	serviceTestMethod := strings.ToUpper(blocks[1])

	serviceTestMethodId, ok := h.TestIdStringMap[serviceTestMethod]

	if !ok {
		return "", nil, fmt.Errorf(F1_INVALID_TEST_ID, serviceTestMethod)
	}

	// --------------- Parsing the Value --------------------

	urlComponents := strings.Split(value, "/")

	// parsing the hostname component, with port and hostname
	valueBlocks := strings.Split(urlComponents[0], ":")
	hostName := ""
	port := ""

	// Precondition: web:9000/test

	if len(valueBlocks) >= 1 {
		hostName = valueBlocks[0]
	}

	if hostName == "" {
		return "", nil, fmt.Errorf(HOSTNAME_ABSENT)
	}

	if len(valueBlocks) >= 2 {
		port = valueBlocks[1]
	}

	path := "/"

	if len(urlComponents) > 1 {
		path += urlComponents[1]
	}

	return serviceName, &ServiceData{
		HostName:   hostName,
		Port:       port,
		Path:       path,
		TestMethod: serviceTestMethodId,
	}, nil
}

// Gets a map of environment variables present
func GetEnvironmentVarMap() map[string]string {
	envVars := os.Environ()
	envMap := make(map[string]string)

	for _, env := range envVars {
		// Just to be sure, was not required
		if env != "" && !strings.HasPrefix(env, "#") {
			keyValue := strings.Split(env, "=")
			envMap[keyValue[0]] = keyValue[1]
		}
	}

	return envMap
}
