package prime_api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/makeplane/plane-ee/monitor/lib/feat_flag"
)

type AirgappedPrimeApi struct {
	PRIVATE_KEY  string
	API_HOSTNAME string
	APP_VERSION  string
}

const (
	WORKSPACE_ACTIVATION_FILE_PATH = "%s/api/payments/workspaces/%s/license-file/"
)

type WorkspaceActivationFileResponse struct {
	URL         string            `json:"url"`
	MembersList []WorkspaceMember `json:"members_list"`
}

type EncryptedFlagsWithVersion struct {
	feat_flag.EncryptedData
	Version string `json:"app_version"`
}

type AirgappedLicensePayload struct {
	WorkspaceActivationResponse
	Flags EncryptedFlagsWithVersion `json:"flags"`
}

/*
	  We will be writing separate implementation for the airgapped api.
		As in airgapped mode, the plan of action will be different from the
		normal mode.
*/
func NewAirgappedApi(privateKey string, apiHostname string, appVersion string) IPrimeMonitorApi {
	return &AirgappedPrimeApi{
		PRIVATE_KEY:  privateKey,
		API_HOSTNAME: apiHostname,
		APP_VERSION:  appVersion,
	}
}

func (a *AirgappedPrimeApi) IsAirgapped() bool {
	return true
}

func (a *AirgappedPrimeApi) AppVersion() string {
	return a.APP_VERSION
}

func (a *AirgappedPrimeApi) ApiHostname() string {
	return a.API_HOSTNAME
}

func (a *AirgappedPrimeApi) PostServiceStatus(payload StatusPayload) ErrorCode {
	return ErrorCode(0) // Assuming 0 means success
}

/*
Feature flags will be provided by means of file, hence the api will throw error
that the feature flags are not supported in airgapped mode.
*/
func (a *AirgappedPrimeApi) GetFeatureFlags(licenseKey string) (*FlagDataResponse, *APIError) {
	return nil, &APIError{
		Error:   "Feature flags not supported, running in airgapped mode",
		Success: false,
	}
}

/*
	  Instance activation and deactivation are not applicable in airgapped mode.
		hence, these are just mock implementation functions.
*/
func (a *AirgappedPrimeApi) ActivateInstance() *APIError {
	return nil
}

func (a *AirgappedPrimeApi) DeactivateInstance() *APIError {
	return nil
}

func (a *AirgappedPrimeApi) InitializeInstance(payload CredentialsPayload) (SetupResponse, *APIError) {
	return SetupResponse{}, &APIError{
		Error:   "Initialize Instance not supported, running in airgapped mode",
		Success: false,
	}
}

/*
		We don't support free workspace activation in airgapped mode,
	  the route handler should support operation
*/
func (a *AirgappedPrimeApi) ActivateFreeWorkspace(payload WorkspaceActivationPayload) (*WorkspaceActivationResponse, *APIError) {
	return nil, &APIError{
		Error:   "Activation Method not supported, running in airgapped mode",
		Success: false,
	}
}

// Disable this method and throw error as this is not applicable in airgapped mode
func (a *AirgappedPrimeApi) ActivateWorkspace(payload WorkspaceActivationPayload) (*WorkspaceActivationResponse, *APIError) {
	return nil, &APIError{
		Error:   "Activation Method not supported, running in airgapped mode",
		Success: false,
	}
}

/*
Downloads the workspace activation file from the server and returns the response and error
*/
func (a *AirgappedPrimeApi) SyncWorkspace(payload WorkspaceSyncPayload) (*WorkspaceActivationResponse, *APIError) {
	// Step 1: Read the file from the local system
	fileContent, err := os.ReadFile(fmt.Sprintf("%s_%s.json", payload.WorkspaceID, a.AppVersion()))
	if err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Failed to read activation file: %v", err),
			Success: false,
		}
	}
	// Step 2: Process the file content (decrypt and parse)
	licensePayload, err := a.processActivationFile(fileContent)
	if err != nil {
		return nil, &APIError{
			Error:   fmt.Sprintf("Failed to process activation file: %v", err),
			Success: false,
		}
	}

	// Step 4: Set workspace information and return response
	licensePayload.WorkspaceID = payload.WorkspaceID
	licensePayload.WorkspaceSlug = payload.WorkspaceSlug

	response := &licensePayload.WorkspaceActivationResponse
	response.MemberList = payload.MembersList

	return response, nil
}

// Helper method to get workspace activation file URL and members list
func (a *AirgappedPrimeApi) getWorkspaceActivationFile(workspaceSlug string) (*WorkspaceActivationFileResponse, error) {
	// Construct the API endpoint URL
	url := fmt.Sprintf(WORKSPACE_ACTIVATION_FILE_PATH, a.API_HOSTNAME, workspaceSlug)

	// Make HTTP GET request
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d", resp.StatusCode)
	}

	// Parse the response
	var fileResponse WorkspaceActivationFileResponse
	if err := json.NewDecoder(resp.Body).Decode(&fileResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &fileResponse, nil
}

// Helper method to download file content from URL
func (a *AirgappedPrimeApi) downloadFileFromURL(url string) ([]byte, error) {
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download file, status: %d", resp.StatusCode)
	}

	content, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read file content: %w", err)
	}

	return content, nil
}

// Helper method to process (decrypt and parse) the activation file
func (a *AirgappedPrimeApi) processActivationFile(fileContent []byte) (*AirgappedLicensePayload, error) {
	// Parse the encrypted data from file content
	var encryptedData feat_flag.EncryptedData
	if err := json.Unmarshal(fileContent, &encryptedData); err != nil {
		return nil, fmt.Errorf("failed to parse encrypted data: %w", err)
	}

	// Decrypt the data
	var looseDecryptedData interface{}
	if err := feat_flag.GetDecryptedJson(a.PRIVATE_KEY, encryptedData, &looseDecryptedData); err != nil {
		return nil, fmt.Errorf("failed to decrypt file: %w", err)
	}

	// Convert to AirgappedLicensePayload
	licensePayload, err := a.convertToAirgappedLicensePayload(looseDecryptedData)
	if err != nil {
		return nil, fmt.Errorf("failed to convert to license payload: %w", err)
	}

	return licensePayload, nil
}

// Helper method to convert interface{} to AirgappedLicensePayload (similar to the handler logic)
func (a *AirgappedPrimeApi) convertToAirgappedLicensePayload(data interface{}) (*AirgappedLicensePayload, error) {
	// First, marshal the interface{} back to JSON bytes
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal decrypted data: %w", err)
	}

	// Fix timestamp format and "None" values
	fixedJson := a.fixTimestampFormat(string(jsonBytes))

	// Unmarshal to AirgappedLicensePayload
	var payload AirgappedLicensePayload
	if err := json.Unmarshal([]byte(fixedJson), &payload); err != nil {
		return nil, fmt.Errorf("failed to unmarshal to AirgappedLicensePayload: %w", err)
	}

	return &payload, nil
}

// Helper method to fix timestamp format (copied from handler logic)
func (a *AirgappedPrimeApi) fixTimestampFormat(jsonStr string) string {
	// Replace "None" with null
	jsonStr = strings.ReplaceAll(jsonStr, `"None"`, "null")

	// Fix timestamp format: replace space between date and time with T
	i := 0
	for i < len(jsonStr) {
		// Find opening quote
		start := strings.Index(jsonStr[i:], `"`)
		if start == -1 {
			break
		}
		start += i

		// Find closing quote
		end := strings.Index(jsonStr[start+1:], `"`)
		if end == -1 {
			break
		}
		end = start + 1 + end

		// Extract the content between quotes
		content := jsonStr[start+1 : end]

		// Check if it looks like a timestamp with space: YYYY-MM-DD HH:MM:SS
		if len(content) >= 19 &&
			content[4] == '-' && content[7] == '-' && content[10] == ' ' &&
			content[13] == ':' && content[16] == ':' {
			// Replace space with T
			fixedContent := content[:10] + "T" + content[11:]
			jsonStr = jsonStr[:start+1] + fixedContent + jsonStr[end:]
		}

		i = end + 1
	}

	return jsonStr
}

/*
We provide a non nil error here, as the route handler handles the deactivate as
if the deactivation is successfull, it will proceed to delete the license from the database
*/
func (a *AirgappedPrimeApi) DeactivateLicense(payload LicenseDeactivatePayload) (*WorkspaceActivationResponse, *APIError) {

	// Delete the license file from the local system
	err := os.Remove(fmt.Sprintf("%s_%s.json", payload.WorkspaceID, a.AppVersion()))
	if err != nil {
		fmt.Println("Failed to delete license file", err)
	}

	response := GetMockWorkspaceActivationResponse(payload, true)
	return response, nil
}

func (a *AirgappedPrimeApi) RetrievePlans(planId string) (*[]Product, *APIError) {
	plans := &[]Product{}
	return plans, nil
}

func (a *AirgappedPrimeApi) RetrievePaymentLink(payload RetrievePaymentLinkPayload) (*RetrievePaymentLinkResponse, *APIError) {
	response := &RetrievePaymentLinkResponse{}
	return response, nil
}

func (a *AirgappedPrimeApi) UpdateSubcription(payload SeatUpdatePayload) (*SeatUpdateResponse, *APIError) {
	response := &SeatUpdateResponse{}
	return response, nil
}

func (a *AirgappedPrimeApi) GetSubscriptionDetails(payload WorkspaceSubscriptionPayload) (*WorkspaceSubscriptionResponse, *APIError) {
	response := &WorkspaceSubscriptionResponse{}
	return response, nil
}

func (a *AirgappedPrimeApi) GetProrationPreview(payload ProrationPreviewPayload) (*ProrationPreviewResponse, *APIError) {
	response := &ProrationPreviewResponse{}
	return response, nil
}

func GetMockWorkspaceActivationResponse(payload LicenseDeactivatePayload, isFree bool) *WorkspaceActivationResponse {
	response := &WorkspaceActivationResponse{
		WorkspaceID:          payload.WorkspaceID,
		InstanceID:           payload.WorkspaceID,
		LicenceKey:           generateRandomLicenseKey(),
		Product:              "FREE",
		ProductType:          "FREE",
		WorkspaceSlug:        payload.WorkspaceSlug,
		Seats:                1,
		FreeSeats:            12,
		Interval:             "month",
		IsOfflinePayment:     false,
		IsCancelled:          false,
		Subscription:         "FREE",
		CurrentPeriodEndDate: time.Now(),
	}

	if isFree {
		response.FreeSeats = 12
	}

	return response
}
