# Prime Healthcheck
Prime Healthcheck is a service that take care of checking for all the running
services in the user's system. Internally the Prime Healthcheck makes network
calls to each of the services that are provided in the environment variables.

## Usage
### `PerformHealthCheck`

`PerformHealthCheck` is the primary method that is responsible for perfoming the
health check over the services provided. Essentially PerformHealthCheck looks up
for environment variables provided with prefix `SERVICE_`, the format is along
the lines of `SERVICE_TESTMETHOD_NAME` where name is the name of the service, 
the corresponding value to this would contain, the exact url to be called for 
that service, without the protocol. The function returns two channel, which can
be used to recieve updates for healthchecks.

***Function Signature*** 
```go
func (h *HealthCheckHandler) PerformHealthCheck(ctx context.Context, options HealthCheckOptions) (chan *HealthCheckStatus, chan *error)
```

```go
package main

func main() {
    // If you have to pass custom test methods
	handler := HealthCheckHandler{
		TestIdMethodMap: T_TestIdMethodMap,
		TestIdStringMap: T_TestIdStringMap,
	}
    // If you want to use default test methods
    handler := NewHealthCheckHandler()

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
    }
```

### `ExecuteHealthCheckWithRetries`

`ExecuteHealthCheckWithRetries` is a method that performs the health check with retries. 
It uses the provided test method and options to repeatedly check the health of a service 
until it either succeeds or exhausts the retry attempts.

***Function Signature***
```go
func (h *HealthCheckHandler) ExecuteHealthCheckWithRetries(ctx context.Context, testMethod HealthCheckMethod, options HealthCheckMethodOptions, wg *sync.WaitGroup, statusChannel chan *HealthCheckStatus, errorChannel chan *error)
```

### `GetServiceFromEnvironment`

`GetServiceFromEnvironment` retrieves a map of services from the environment variables. 
It filters the environment variables to only include those with the prefix `SERVICE_` and 
parses them into a map of service names to `ServiceData`.

***Function Signature***
```go
func (h *HealthCheckHandler) GetServiceFromEnvironment() (map[string]*ServiceData, error)
```

### `ParseKeyValue`

`ParseKeyValue` parses a key-value pair from the environment variables into a service 
name and `ServiceData`. It splits the key and value into their respective components 
and validates them.

***Function Signature***
```go 
func (h *HealthCheckHandler) ParseKeyValue(key string, value string) (string, *ServiceData, error)
```

### `GetEnvironmentVarMap`

`GetEnvironmentVarMap` retrieves all environment variables and returns them as a map 
of key-value pairs. It filters out any empty or commented-out variables.

***Function Signature***
```go 
func GetEnvironmentVarMap() map[string]string
```

... For understanding more, please read healthcheck.go and healthcheck_method.go
