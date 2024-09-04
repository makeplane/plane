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
	GetFeatureFlags(licenseKey string) (*FlagDataResponse, ErrorCode)
	ActivateInstance() ErrorCode
	DeactivateInstance() ErrorCode
	UpdateSubcription(SeatUpdatePayload) (*SeatUpdateResponse, ErrorCode)
	SyncWorkspace(WorkspaceSyncPayload) (*WorkspaceActivationResponse, ErrorCode)
	ActivateWorkspace(WorkspaceActivationPayload) (*WorkspaceActivationResponse, ErrorCode)
	ActivateFreeWorkspace(WorkspaceActivationPayload) (*WorkspaceActivationResponse, ErrorCode)
	InitializeInstance(CredentialsPayload) (SetupResponse, error)
	GetSubscriptionDetails(WorkspaceSubscriptionPayload) (*WorkspaceSubscriptionResponse, ErrorCode)
}

type PrimeMonitorApi struct {
	host             string
	instanceId       string
	appVersion       string
	client           string
	version          string
	machineSignature string
}

type CredentialsPayload struct {
	ServerId string
	Domain   string
}

type WorkspaceSubscriptionPayload struct {
	WorkspaceId string `json:"workspace_id"`
	LicenseKey  string `json:"license_key"`
}

type WorkspaceSubscriptionResponse struct {
	Product            string `json:"product"`
	CurrentPeriodEnd   string `json:"current_period_end_date"`
	SubscriptionExists bool   `json:"subscription_exists"`
	Url                string `json:"url"`
}

type SetupResponse struct {
	Domain     string `json:"domain"`
	InstanceId string `json:"instance_id"`
	Host       string `json:"prime_host"`
	Version    string `json:"version"`
}

type FlagsPayload struct {
	EncryptedData string `json:"encrypted_data"`
}

func NewMonitorApi(host, machineSignature, instanceId, appVersion string) IPrimeMonitorApi {
	return &PrimeMonitorApi{
		host:             host,
		instanceId:       instanceId,
		appVersion:       appVersion,
		client:           "Prime-Monitor",
		version:          appVersion,
		machineSignature: machineSignature,
	}
}

func (api *PrimeMonitorApi) SetClient(client string) {
	api.client = client
}

var (
	API_PREFIX              = "/api/v2"
	MONITOR_ENDPOINT        = API_PREFIX + "/monitor/"
	FEATURE_FLAGS           = API_PREFIX + "/flags/"
	INSTANCE_PREFIX         = API_PREFIX + "/instances"
	ACTIVATE_INSTANCE       = INSTANCE_PREFIX + "/activate/"
	DEACTIVATE_INSTANCE     = INSTANCE_PREFIX + "/deactivate/"
	UPGRADE_INSTANCE        = INSTANCE_PREFIX + "/upgrade/"
	FREE_WORKSPACE_ACTIVATE = API_PREFIX + "/licenses/initialize/"
	WORKSPACE_ACTIVATE      = API_PREFIX + "/licenses/activate/"
	SYNC_WORKSPACE          = API_PREFIX + "/licenses/sync/"
	UPDATE_SUBSCRIPTION     = API_PREFIX + "/modify-subscriptions/"
	SETUP_ENDPOINT          = API_PREFIX + "/instances/initialize/"
	SUBSCRIPTION_PORTAL     = API_PREFIX + "/subscription-portal/"
)

/* ----------------------- Controller Methods ------------------------------ */
// Posts the status of the services given, to the prime server, returns error if
// hinderer, else doesn't return anything
func (api *PrimeMonitorApi) PostServiceStatus(payload StatusPayload) ErrorCode {
	_, err := api.post(api.host+MONITOR_ENDPOINT, payload)
	if err != nil {
		return UNABLE_TO_POST_SERVICE_STATUS
	}
	return 0
}

func (api *PrimeMonitorApi) ActivateFreeWorkspace(payload WorkspaceActivationPayload) (*WorkspaceActivationResponse, ErrorCode) {
	resp, err := api.post(api.host+FREE_WORKSPACE_ACTIVATE, payload)
	if err != nil {
		return nil, UNABLE_TO_ACTIVATE_WORKSPACE
	}
	data := WorkspaceActivationResponse{}
	err = json.Unmarshal(resp, &data)
	if err != nil {
		return nil, UNABLE_TO_ACTIVATE_WORKSPACE
	}
	return &data, 0
}

// Activating a paid licensed workspace
func (api *PrimeMonitorApi) ActivateWorkspace(payload WorkspaceActivationPayload) (*WorkspaceActivationResponse, ErrorCode) {
	resp, err := api.post(api.host+WORKSPACE_ACTIVATE, payload)
	if err != nil {
		return nil, UNABLE_TO_ACTIVATE_WORKSPACE
	}
	data := WorkspaceActivationResponse{}
	err = json.Unmarshal(resp, &data)
	if err != nil {
		return nil, UNABLE_TO_ACTIVATE_WORKSPACE
	}
	return &data, 0
}

func (api *PrimeMonitorApi) GetFeatureFlags(licenseKey string) (*FlagDataResponse, ErrorCode) {
	flagData, err := api.post(api.host+FEATURE_FLAGS, map[string]string{
		"license_key": licenseKey,
		"version":     api.version,
	})
	if err != nil {
		return nil, UNABLE_TO_GET_FEATURE_FLAGS
	}
	data := FlagDataResponse{}
	err = json.Unmarshal(flagData, &data)
	if err != nil {
		return nil, UNABLE_TO_PARSE_FEATURE_FLAGS
	}
	return &data, 0
}

func (api *PrimeMonitorApi) SyncWorkspace(payload WorkspaceSyncPayload) (*WorkspaceActivationResponse, ErrorCode) {
	resp, err := api.post(api.host+SYNC_WORKSPACE, payload)
	if err != nil {
		return nil, UNABLE_TO_SYNC_WORKSPACE
	}
	data := WorkspaceActivationResponse{}
	err = json.Unmarshal(resp, &data)

	if err != nil {
		return nil, UNABLE_TO_SYNC_WORKSPACE
	}
	return &data, 0
}

func (api *PrimeMonitorApi) ActivateInstance() ErrorCode {
	_, err := api.post(api.host+ACTIVATE_INSTANCE, nil)
	if err != nil {
		return UNABLE_TO_ACTIVATE_WORKSPACE
	}
	return 0
}

func (api *PrimeMonitorApi) DeactivateInstance() ErrorCode {
	_, err := api.post(api.host+DEACTIVATE_INSTANCE, nil)
	if err != nil {
		return UNABLE_TO_ACTIVATE_WORKSPACE
	}
	return 0
}

func (api *PrimeMonitorApi) UpgradeInstance() ErrorCode {
	_, err := api.post(api.host+UPGRADE_INSTANCE, nil)
	if err != nil {
		return UNABLE_TO_ACTIVATE_WORKSPACE
	}
	return 0
}

func (api *PrimeMonitorApi) UpdateSubcription(payload SeatUpdatePayload) (*SeatUpdateResponse, ErrorCode) {
	resp, err := api.post(api.host+UPDATE_SUBSCRIPTION, payload)
	if err != nil {
		return nil, UNABLE_TO_UPDATE_SEATS
	}

	data := SeatUpdateResponse{}
	err = json.Unmarshal(resp, &data)

	if err != nil {
		return nil, UNABLE_TO_SYNC_WORKSPACE
	}
	return &data, 0
}

func (api *PrimeMonitorApi) InitializeInstance(payload CredentialsPayload) (SetupResponse, error) {
	resp, err := api.post(api.host+SETUP_ENDPOINT, map[string]string{
		"machine_signature": payload.ServerId,
		"domain":            payload.Domain,
	})

	if err != nil {
		return SetupResponse{}, err
	}

	// Unmarshal the response
	setupResponse := SetupResponse{}
	err = json.Unmarshal(resp, &setupResponse)
	if err != nil {
		return SetupResponse{}, err
	}
	return setupResponse, err
}

func (api *PrimeMonitorApi) GetSubscriptionDetails(payload WorkspaceSubscriptionPayload) (*WorkspaceSubscriptionResponse, ErrorCode) {
	resp, err := api.post(api.host+SUBSCRIPTION_PORTAL, payload)
	if err != nil {
		return nil, UNABLE_TO_FETCH_WORKSPACE_SUBSCRIPTION
	}

	data := WorkspaceSubscriptionResponse{}
	err = json.Unmarshal(resp, &data)
	if err != nil {
		return nil, UNABLE_TO_FETCH_WORKSPACE_SUBSCRIPTION
	}
	return &data, 0
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
		"X-Instance-Id":       api.instanceId,
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
