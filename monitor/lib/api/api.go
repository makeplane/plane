package prime_api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

type IPrimeMonitorApi interface {
	PostServiceStatus(StatusPayload) ErrorCode
}

type PrimeMonitorApi struct {
	host             string
	apiKey           string
	client           string
	version          string
	machineSignature string
}

func NewMonitorApi(host, apiKey, version, machineSignature string) IPrimeMonitorApi {
	return &PrimeMonitorApi{
		host:             host,
		apiKey:           apiKey,
		client:           "Prime-Monitor",
		version:          version,
		machineSignature: machineSignature,
	}
}

func (api *PrimeMonitorApi) SetClient(client string) {
	api.client = client
}

var (
	API_PREFIX       = "/api"
	MONITOR_ENDPOINT = API_PREFIX + "/monitor/"
)

// ----------------------- Controller Methods ------------------------------

// Posts the status of the services given, to the prime server, returns error if
// hinderer, else doesn't return anything
func (api *PrimeMonitorApi) PostServiceStatus(payload StatusPayload) ErrorCode {
	_, err := api.post(api.host+MONITOR_ENDPOINT, payload)
	if err != nil {
		fmt.Println(err)
		return UNABLE_TO_POST_SERVICE_STATUS
	}
	return 0
}

// ------------------------ Helper Methods ----------------------------------
/*
prepareRequest prepares an HTTP request with the necessary headers and parameters.

Parameters:
- method: string specifying the HTTP method (e.g., "GET", "POST").
- urlStr: string specifying the URL for the request.
- body: io.Reader containing the request body.
- params: map[string]string containing the query parameters.

Returns:
- *http.Request: The prepared HTTP request.
- error: An error if any occurs during the preparation.
*/
func (api *PrimeMonitorApi) prepareRequest(method, urlStr string, body io.Reader, params map[string]string) (*http.Request, error) {
	if method == "GET" && params != nil {
		parsedURL, err := url.Parse(urlStr)
		if err != nil {
			return nil, fmt.Errorf("error parsing URL: %v", err)
		}
		query := parsedURL.Query()
		for key, value := range params {
			query.Set(key, value)
		}
		parsedURL.RawQuery = query.Encode()
		urlStr = parsedURL.String()
	}

	req, err := http.NewRequest(method, urlStr, body)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	headers := map[string]string{
		"X-Api-Key":           api.apiKey,
		"X-Machine-Signature": api.machineSignature,
		"X-Client":            api.client,
		"X-License-Version":   api.version,
		"Content-Type":        "application/json",
	}

	for key, value := range headers {
		req.Header.Add(key, value)
	}

	return req, nil
}

/*
doRequest executes the HTTP request and handles common response scenarios.

Parameters:
- req: *http.Request specifying the HTTP request to execute.

Returns:
- []byte: The response body.
- error: An error if any occurs during the request execution.
*/
func (api *PrimeMonitorApi) doRequest(req *http.Request) ([]byte, error) {
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %v", err)
	}
	defer resp.Body.Close()

	switch {
	case resp.StatusCode >= 200 && resp.StatusCode <= 227:
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("error reading response body: %v", err)
		}
		return body, nil
	case resp.StatusCode >= 300 && resp.StatusCode <= 308:
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("error reading response body: %v", err)
		}
		return body, nil
	case resp.StatusCode >= 400 && resp.StatusCode <= 451:
		return nil, fmt.Errorf("unexpected status code %d", resp.StatusCode)
	default:
		return nil, fmt.Errorf("unexpected status code: %v", resp.StatusCode)
	}
}

/*
get performs a GET request.

Parameters:
- baseURL: string specifying the base URL for the request.
- params: map[string]string containing the query parameters.

Returns:
- []byte: The response body.
- error: An error if any occurs during the request.
*/
func (api *PrimeMonitorApi) get(baseURL string, params map[string]string) ([]byte, error) {
	req, err := api.prepareRequest("GET", baseURL, nil, params)
	if err != nil {
		return nil, err
	}

	return api.doRequest(req)
}

/*
post performs a POST request with JSON body.

Parameters:
- baseURL: string specifying the base URL for the request.
- data: interface{} containing the data to be sent in the request body.

Returns:
- []byte: The response body.
- error: An error if any occurs during the request.
*/
func (api *PrimeMonitorApi) post(baseURL string, data interface{}) ([]byte, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("error marshaling data: %v", err)
	}

	req, err := api.prepareRequest("POST", baseURL, bytes.NewBuffer(jsonData), nil)
	if err != nil {
		return nil, err
	}

	return api.doRequest(req)
}
