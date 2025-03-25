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
	GetFeatureFlags(licenseKey string) (*FlagDataResponse, *APIError)
	ActivateInstance() *APIError
	DeactivateInstance() *APIError
	RetrievePlans(string) (*[]Product, *APIError)
	RetrievePaymentLink(RetrievePaymentLinkPayload) (*RetrievePaymentLinkResponse, *APIError)
	UpdateSubcription(SeatUpdatePayload) (*SeatUpdateResponse, *APIError)
	SyncWorkspace(WorkspaceSyncPayload) (*WorkspaceActivationResponse, *APIError)
	DeactivateLicense(LicenseDeactivatePayload) (*WorkspaceActivationResponse, *APIError)
	ActivateWorkspace(WorkspaceActivationPayload) (*WorkspaceActivationResponse, *APIError)
	ActivateFreeWorkspace(WorkspaceActivationPayload) (*WorkspaceActivationResponse, *APIError)
	InitializeInstance(CredentialsPayload) (SetupResponse, *APIError)
	GetSubscriptionDetails(WorkspaceSubscriptionPayload) (*WorkspaceSubscriptionResponse, *APIError)
	GetProrationPreview(ProrationPreviewPayload) (*ProrationPreviewResponse, *APIError)
}

type LicenseDeactivatePayload struct {
	WorkspaceSlug string `json:"workspace_slug"`
	WorkspaceID   string `json:"workspace_id"`
	LicenseKey    string `json:"license_key"`
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
	ServerId   string
	Domain     string
	AppVersion string
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

type ProrationPreviewPayload struct {
	WorkspaceId   string `json:"workspace_id"`
	Quantity      int    `json:"quantity"`
	WorkspaceSlug string `json:"workspace_slug"`
	LicenseKey    string `json:"license_key"`
}

type ProrationPreviewResponse struct {
	QuantityDifference     int     `json:"quantity_difference"`
	PerSeatProrationAmount float64 `json:"per_seat_prorated_amount"`
	NewQuantity            int     `json:"new_quantity"`
	TotalProratedAmount    float64 `json:"total_prorated_amount"`
	CurrentQuantity        int     `json:"current_quantity"`
	CurrentPriceAmount     float64 `json:"current_price_amount"`
	CurrentPriceInterval   string  `json:"current_price_interval"`
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

// Add this struct to handle the error response from the server
type ErrorResponse struct {
	Message string `json:"message"`
	Error   string `json:"error"`
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
	API_PREFIX                  = "/api/v2"
	MONITOR_ENDPOINT            = API_PREFIX + "/monitor/"
	FEATURE_FLAGS               = API_PREFIX + "/flags/"
	INSTANCE_PREFIX             = API_PREFIX + "/instances"
	ACTIVATE_INSTANCE           = INSTANCE_PREFIX + "/activate/"
	DEACTIVATE_INSTANCE         = INSTANCE_PREFIX + "/deactivate/"
	UPGRADE_INSTANCE            = INSTANCE_PREFIX + "/upgrade/"
	FREE_WORKSPACE_ACTIVATE     = API_PREFIX + "/licenses/initialize/"
	WORKSPACE_ACTIVATE          = API_PREFIX + "/licenses/activate/"
	SYNC_WORKSPACE              = API_PREFIX + "/licenses/sync/"
	UPDATE_SUBSCRIPTION         = API_PREFIX + "/modify-subscriptions/"
	SETUP_ENDPOINT              = API_PREFIX + "/instances/initialize/"
	SUBSCRIPTION_PORTAL         = API_PREFIX + "/subscription-portal/"
	RETRIEVE_PLANS              = API_PREFIX + "/instances/products/"
	RETRIEVE_PAYMENT_LINK       = API_PREFIX + "/instances/payment-link/"
	DEACTIVATE_LICENSE_ENDPOINT = API_PREFIX + "/licenses/deactivate/"
	PRORATION_PREVIEW           = API_PREFIX + "/subscriptions/proration-preview/"
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

func (api *PrimeMonitorApi) DeactivateLicense(payload LicenseDeactivatePayload) (*WorkspaceActivationResponse, *APIError) {
	resp, apiError := api.post(api.host+DEACTIVATE_LICENSE_ENDPOINT, payload)
	if apiError != nil {
		return nil, apiError
	}
	data := WorkspaceActivationResponse{}

	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}

	return &data, nil
}

func (api *PrimeMonitorApi) ActivateFreeWorkspace(payload WorkspaceActivationPayload) (*WorkspaceActivationResponse, *APIError) {
	resp, apiError := api.post(api.host+FREE_WORKSPACE_ACTIVATE, payload)
	if apiError != nil {
		return nil, apiError
	}
	data := WorkspaceActivationResponse{}
	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return &data, nil
}

// Activating a paid licensed workspace
func (api *PrimeMonitorApi) ActivateWorkspace(payload WorkspaceActivationPayload) (*WorkspaceActivationResponse, *APIError) {
	resp, apiError := api.post(api.host+WORKSPACE_ACTIVATE, payload)
	if apiError != nil {
		return nil, apiError
	}
	data := WorkspaceActivationResponse{}
	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return &data, nil
}

func (api *PrimeMonitorApi) GetFeatureFlags(licenseKey string) (*FlagDataResponse, *APIError) {
	flagData, apiError := api.post(api.host+FEATURE_FLAGS, map[string]string{
		"license_key": licenseKey,
		"version":     api.version,
	})
	if apiError != nil {
		return nil, apiError
	}
	data := FlagDataResponse{}
	if err := json.Unmarshal(flagData, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return &data, nil
}

func (api *PrimeMonitorApi) RetrievePlans(quantity string) (*[]Product, *APIError) {
	resp, apiError := api.get(api.host+RETRIEVE_PLANS, map[string]string{
		"quantity": quantity,
	})
	if apiError != nil {
		return nil, apiError
	}
	data := []Product{}
	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return &data, nil
}

func (api *PrimeMonitorApi) RetrievePaymentLink(payload RetrievePaymentLinkPayload) (*RetrievePaymentLinkResponse, *APIError) {
	resp, apiError := api.post(api.host+RETRIEVE_PAYMENT_LINK, payload)
	if apiError != nil {
		return nil, apiError
	}
	data := RetrievePaymentLinkResponse{}
	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return &data, nil
}

func (api *PrimeMonitorApi) SyncWorkspace(payload WorkspaceSyncPayload) (*WorkspaceActivationResponse, *APIError) {
	resp, apiError := api.post(api.host+SYNC_WORKSPACE, payload)
	if apiError != nil {
		return nil, apiError
	}
	data := WorkspaceActivationResponse{}
	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return &data, nil
}

func (api *PrimeMonitorApi) ActivateInstance() *APIError {
	_, apiError := api.post(api.host+ACTIVATE_INSTANCE, nil)
	if apiError != nil {
		return apiError
	}
	return nil
}

func (api *PrimeMonitorApi) DeactivateInstance() *APIError {
	_, apiError := api.post(api.host+DEACTIVATE_INSTANCE, nil)
	if apiError != nil {
		return apiError
	}
	return nil
}

func (api *PrimeMonitorApi) UpgradeInstance() *APIError {
	_, apiError := api.post(api.host+UPGRADE_INSTANCE, nil)
	if apiError != nil {
		return apiError
	}
	return nil
}

func (api *PrimeMonitorApi) UpdateSubcription(payload SeatUpdatePayload) (*SeatUpdateResponse, *APIError) {
	resp, apiError := api.post(api.host+UPDATE_SUBSCRIPTION, payload)
	if apiError != nil {
		return nil, apiError
	}

	data := SeatUpdateResponse{}
	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return &data, nil
}

func (api *PrimeMonitorApi) InitializeInstance(payload CredentialsPayload) (SetupResponse, *APIError) {
	resp, apiError := api.post(api.host+SETUP_ENDPOINT, map[string]string{
		"machine_signature": payload.ServerId,
		"domain":            payload.Domain,
		"app_version":       payload.AppVersion,
		"deploy_platform":   "KUBERNETES",
	})

	if apiError != nil {
		return SetupResponse{}, apiError
	}

	setupResponse := SetupResponse{}
	if err := json.Unmarshal(resp, &setupResponse); err != nil {
		return SetupResponse{}, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return setupResponse, nil
}

func (api *PrimeMonitorApi) GetSubscriptionDetails(payload WorkspaceSubscriptionPayload) (*WorkspaceSubscriptionResponse, *APIError) {
	resp, apiError := api.post(api.host+SUBSCRIPTION_PORTAL, payload)
	if apiError != nil {
		return nil, apiError
	}

	data := WorkspaceSubscriptionResponse{}
	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	return &data, nil
}

func (api *PrimeMonitorApi) GetProrationPreview(payload ProrationPreviewPayload) (*ProrationPreviewResponse, *APIError) {
	// Make the request
	resp, apiError := api.post(api.host+PRORATION_PREVIEW, payload)
	if apiError != nil {
		return nil, apiError
	}

	// Unmarshal the response
	data := ProrationPreviewResponse{}
	if err := json.Unmarshal(resp, &data); err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Error unmarshaling response: %v", err),
			Success: false,
		}
	}
	// Return the response
	return &data, nil
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
func (api *PrimeMonitorApi) doRequest(req *http.Request) ([]byte, *APIError) {
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("error making request: %v", err),
			Success: false,
		}
	}
	defer resp.Body.Close()

	switch {
	case resp.StatusCode >= 200 && resp.StatusCode <= 227:
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, &APIError{
				Error:   fmt.Sprintf("error reading response body: %v", err),
				Success: false,
			}
		}
		return body, nil
	case resp.StatusCode >= 300 && resp.StatusCode <= 308:
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, &APIError{
				Error:   fmt.Sprintf("error reading response body: %v", err),
				Success: false,
			}
		}
		return body, nil
	case resp.StatusCode >= 400 && resp.StatusCode <= 451:
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, &APIError{
				Error:   fmt.Sprintf("error reading response body: %v", err),
				Success: false,
			}
		}

		// Try to parse the error response
		var errorResp ErrorResponse
		if err := json.Unmarshal(body, &errorResp); err != nil {
			// If we can't parse the error, return the status code
			return nil, &APIError{
				Error:   fmt.Sprintf("unexpected status code %d", resp.StatusCode),
				Success: false,
			}
		}

		return nil, &APIError{
			Error:   errorResp.Error,
			Success: false,
		}
	default:
		return nil, &APIError{
			Error:   fmt.Sprintf("unexpected status code: %v", resp.StatusCode),
			Success: false,
		}
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
func (api *PrimeMonitorApi) get(baseURL string, params map[string]string) ([]byte, *APIError) {
	req, err := api.prepareRequest("GET", baseURL, nil, params)
	if err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("error preparing request: %v", err),
			Success: false,
		}
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
func (api *PrimeMonitorApi) post(baseURL string, data interface{}) ([]byte, *APIError) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("error marshaling data: %v", err),
			Success: false,
		}
	}

	req, err := api.prepareRequest("POST", baseURL, bytes.NewBuffer(jsonData), nil)
	if err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("error preparing request: %v", err),
			Success: false,
		}
	}

	return api.doRequest(req)
}
