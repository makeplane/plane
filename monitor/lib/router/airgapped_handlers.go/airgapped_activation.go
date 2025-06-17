package airgapped_handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/lib/feat_flag"
	router_helpers "github.com/makeplane/plane-ee/monitor/lib/router/helpers"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
	"gorm.io/gorm"
)

const (
	AdminRole = 15
	OwnerRole = 20
)

type EncryptedFlagsWithVersion struct {
	feat_flag.EncryptedData
	Version string `json:"app_version"`
}

type AirgappedLicensePayload struct {
	prime_api.WorkspaceActivationResponse
	Flags   EncryptedFlagsWithVersion `json:"flags"`
	Version string                    `json:"version"`
}

func GetAirgappedActivationHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		// Get the file from the request
		file, err := ctx.FormFile("activation_file")
		workspaceId := ctx.FormValue("workspace_id", "")
		workspaceSlug := ctx.FormValue("workspace_slug", "")
		membersListValue := ctx.FormValue("members_list", "[]")

		if workspaceId == "" || workspaceSlug == "" || membersListValue == "[]" {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "No workspace id, slug or members list provided",
			})
		}

		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "No file uploaded. Please upload the activation file.",
			})
		}

		// If the extension of the file is not `.json`, return error for unsupported file type
		if file.Header.Get("Content-Type") != "application/json" {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Unsupported file type. Please upload a .json file.",
			})
		}

		// Open the file and get the file content
		fileContent, err := file.Open()
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to read the file",
			})
		}

		// Read the file content
		content, err := io.ReadAll(fileContent)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to read the file",
			})
		}

		// Create filename using workspaceId
		filename := fmt.Sprintf("%s.json", workspaceId)

		// Write content to file
		err = os.WriteFile(filename, content, 0644)
		if err != nil {
			// Let's not return an error here, as we want to continue with the activation
			fmt.Println("Failed to write file to local system", err)
		}

		// Parse the json text file for the encrypted data
		var encryptedData feat_flag.EncryptedData

		/*
			Why use `interface{}` instead of `AirgappedLicensePayload` directly?
			The issue is that the `AirgappedLicensePayload` struct has to use custom unmarshaler that
			handles the timestamp format conversion and "None" values, as the timestamp format is not
			standard and the "None" values are not handled by the default unmarshaler.
			So we use `interface{}` to unmarshal the data and then convert it to `AirgappedLicensePayload`
			using the custom unmarshaler.
		*/
		var looseDecryptedData interface{}
		err = json.Unmarshal(content, &encryptedData)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to parse the file",
			})
		}

		err = feat_flag.GetDecryptedJson(key, encryptedData, &looseDecryptedData)
		if err != nil {
			fmt.Println("Failed to decrypt the file", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to decrypt the file",
			})
		}

		decryptedData, err := ConvertToAirgappedLicensePayload(looseDecryptedData)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to parse the file",
			})
		}

		decryptedData.WorkspaceID = workspaceId
		decryptedData.WorkspaceSlug = workspaceSlug

		// In the Go code, when receiving:
		var memberList []prime_api.WorkspaceMember
		err = json.Unmarshal([]byte(membersListValue), &memberList)
		if err != nil {
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to parse the members list",
			})
		}

		// Warm up the database with the payload
		if err := PopulateDatabaseWithFilePayload(decryptedData, memberList); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Workspace activated successfully",
		})
	}
}

/*
We need to warm up the database with the payload of the file
which includes the license, feature flags and workspace details
*/
func PopulateDatabaseWithFilePayload(payload *AirgappedLicensePayload, memberList []prime_api.WorkspaceMember) error {
	activationPayload := payload.WorkspaceActivationResponse
	featureFlags := payload.Flags

	// Create the license payload from the activation payload
	license, err := router_helpers.ConvertWorkspaceActivationResponseToLicense(&activationPayload)
	if err != nil {
		return fmt.Errorf("failed to convert workspace activation response to license: %w", err)
	}

	/*
		Exit Cases
		- If the current license already exists for any workspace which is not a free license, return an error
		- If the current workspace is already associated with a license, which is not the current license, return error
		- If the number of seats in the license is less than the number of members, return error

		Entry Case
		- If we are fine with the above cases, we need to,
		  - Delete the existing license, feature flags and user licenses
			- Create the new license and associated feature flags and user licenses
	*/
	return db.Db.Transaction(func(tx *gorm.DB) error {
		// === EXIT CASES VALIDATION ===

		// Exit Case 1: Check if license already exists for a different workspace (and is not free)
		var existingLicense db.License
		err := tx.Where("license_key = ?", license.LicenseKey).First(&existingLicense).Error
		if err == nil {
			// License exists - check if it's for a different workspace
			if existingLicense.WorkspaceID != license.WorkspaceID {
				return fmt.Errorf("license already exists for another workspace")
			}
		}

		// Exit Case 2: Check if workspace is already associated with a different license
		var workspaceLicense db.License
		err = tx.Where("workspace_id = ? AND workspace_slug = ?", license.WorkspaceID, license.WorkspaceSlug).First(&workspaceLicense).Error
		if err == nil {
			// Workspace has a license - check if it's different from the current one
			if (workspaceLicense.ProductType != "FREE") && (workspaceLicense.LicenseKey != license.LicenseKey) {
				// If the workspace has a non-free license, and the license key is different, return an error
				return fmt.Errorf("workspace is already associated with a different license, please deactivate the existing license first")
			}
		}

		// Exit Case 3: Check if license has enough seats for members
		billedMembers := 0
		for _, member := range memberList {
			if member.UserRole == AdminRole || member.UserRole == OwnerRole {
				billedMembers++
			}
		}

		if license.Seats < billedMembers {
			return fmt.Errorf("license has less seats (%d) than the number of billed members (%d)", license.Seats, billedMembers)
		}

		// === ENTRY CASE: CLEANUP AND CREATION ===

		// Step 1: Delete existing license, feature flags and user licenses for this license key
		if err := tx.Where("license_id IN (SELECT id FROM licenses WHERE license_key = ?)", license.LicenseKey).Delete(&db.Flags{}).Error; err != nil {
			return fmt.Errorf("failed to delete existing feature flags: %w", err)
		}

		if err := tx.Where("license_id IN (SELECT id FROM licenses WHERE license_key = ?)", license.LicenseKey).Delete(&db.UserLicense{}).Error; err != nil {
			return fmt.Errorf("failed to delete existing user licenses: %w", err)
		}

		if err := tx.Where("license_key = ?", license.LicenseKey).Delete(&db.License{}).Error; err != nil {
			return fmt.Errorf("failed to delete existing license: %w", err)
		}

		// Step 2: Delete any existing license for this workspace (if different)
		if err := tx.Where("workspace_id = ? AND workspace_slug = ? AND license_key != ?",
			license.WorkspaceID, license.WorkspaceSlug, license.LicenseKey).Delete(&db.License{}).Error; err != nil {
			return fmt.Errorf("failed to delete workspace's existing license: %w", err)
		}

		// We are explicitly setting the license to be airgapped, as we are not making any calls to the prime server
		license.IsAirgapped = true

		// Step 3: Create the new license
		if err := tx.Create(license).Error; err != nil {
			return fmt.Errorf("failed to create new license: %w", err)
		}

		// Step 4: Create feature flags
		featureFlagsPayload := db.Flags{
			LicenseID:  license.ID,
			Version:    payload.Version,
			AesKey:     featureFlags.AesKey,
			Nonce:      featureFlags.Nonce,
			CipherText: featureFlags.CipherText,
			Tag:        featureFlags.Tag,
		}

		if err := tx.Create(&featureFlagsPayload).Error; err != nil {
			return fmt.Errorf("failed to create feature flags: %w", err)
		}

		// Step 5: Create user licenses
		if len(memberList) > 0 {
			userLicenses := make([]*db.UserLicense, 0, len(memberList))
			for _, member := range memberList {
				userLicenses = append(userLicenses, &db.UserLicense{
					LicenseID: license.ID,
					UserID:    uuid.MustParse(member.UserId),
					Role:      member.UserRole,
					IsActive:  true,
					Synced:    true,
				})
			}

			if err := tx.Create(&userLicenses).Error; err != nil {
				return fmt.Errorf("failed to create user licenses: %w", err)
			}
		}

		return nil
	})
}

func fixTimestampFormat(jsonStr string) string {
	// Replace "None" with null
	jsonStr = strings.ReplaceAll(jsonStr, `"None"`, "null")

	// Fix timestamp format: replace space between date and time with T
	// This handles the pattern: "YYYY-MM-DD HH:MM:SS+/-TZ:TZ" -> "YYYY-MM-DDTHH:MM:SS+/-TZ:TZ"
	// Use a simple approach: look for the pattern " HH:MM:SS" in quoted strings and replace space with T
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

// UnmarshalJSON implements custom JSON unmarshaling for AirgappedLicensePayload
// to handle timestamp format conversion and "None" values
func (a *AirgappedLicensePayload) UnmarshalJSON(data []byte) error {
	// Fix the JSON format before unmarshaling
	fixedJson := fixTimestampFormat(string(data))

	// Create a temporary struct to unmarshal into
	type TempPayload AirgappedLicensePayload
	temp := &TempPayload{}

	// Unmarshal the fixed JSON
	if err := json.Unmarshal([]byte(fixedJson), temp); err != nil {
		return err
	}

	// Copy the data back to the original struct
	*a = AirgappedLicensePayload(*temp)
	return nil
}

// Helper function to convert interface{} to AirgappedLicensePayload
func ConvertToAirgappedLicensePayload(data interface{}) (*AirgappedLicensePayload, error) {
	// First, marshal the interface{} back to JSON bytes
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal decrypted data: %w", err)
	}

	// Then unmarshal using our custom logic
	var payload AirgappedLicensePayload
	if err := payload.UnmarshalJSON(jsonBytes); err != nil {
		return nil, fmt.Errorf("failed to unmarshal to AirgappedLicensePayload: %w", err)
	}

	return &payload, nil
}
