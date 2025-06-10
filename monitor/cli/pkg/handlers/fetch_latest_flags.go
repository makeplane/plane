package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
	"gorm.io/gorm"
)

// LICENSE_VERIFICATION_FAILED_THRESHOLD is the threshold for the license verification for moving to the free plan
const LICENSE_VERIFICATION_FAILED_THRESHOLD = 7 * 24 * time.Hour

// Fetches all the licenses from the database and updates the flags
func UpdateFlagsHandler(ctx context.Context, api prime_api.IPrimeMonitorApi) error {
	var licenses []db.License
	if err := db.Db.Find(&licenses).Error; err != nil {
		return err
	}

	// Concurrency has been removed from here, as when we make concurrent request
	// to the API and attempt to save the data in the database, there are cases
	// where the database is locked and we are not able to save the data.
	for _, license := range licenses {
		err := db.Db.Transaction(func(tx *gorm.DB) error {
			// Job One: Verify the license and update the license data
			updatedLicense, activationReponse, err := RefreshLicense(ctx, api, &license, tx)
			// If the license is paid, update the users with the member list provided
			if err != nil {
				return err
			}

			// If the license is airgapped, pause the execution of the function and return nil
			if api.IsAirgapped() {
				return nil
			}

			// Job Two: Update the users with the member list provided
			if err := RefreshLicenseUsers(ctx, updatedLicense, *activationReponse, tx); err != nil {
				return err
			}

			if updatedLicense.ProductType != "FREE" {
				if err := RefreshFeatureFlags(ctx, api, *updatedLicense, tx); err != nil {
					return err
				}
			}

			return nil
		})

		// Continue to the next license if there is an error
		if err != nil {
			fmt.Println("Failed to update flags for license", license.LicenseKey, license.WorkspaceSlug, err)
		}
	}

	return nil
}

// Verify License, will hit the Instance Initialization Endpoint and will
// replace the existing data with the new data that is fetched from the API.
func RefreshLicense(ctx context.Context, api prime_api.IPrimeMonitorApi, license *db.License, tx *gorm.DB) (*db.License, *prime_api.WorkspaceActivationResponse, error) {
	// Acquire all the members for the license
	members := []db.UserLicense{}
	if err := tx.Where("license_id = ?", license.ID).Find(&members).Error; err != nil {
		return nil, nil, err
	}

	workspaceMembers := []prime_api.WorkspaceMember{}

	for _, member := range members {
		workspaceMembers = append(workspaceMembers, prime_api.WorkspaceMember{
			UserId:   member.UserID.String(),
			UserRole: member.Role,
		})
	}

	// Get the new data from the license
	data, err := api.SyncWorkspace(prime_api.WorkspaceSyncPayload{
		WorkspaceSlug: license.WorkspaceSlug,
		WorkspaceID:   license.WorkspaceID.String(),
		LicenceKey:    license.LicenseKey,
		MembersList:   workspaceMembers,
	})

	verificationThreshhold := LICENSE_VERIFICATION_FAILED_THRESHOLD

	shouldDeactivate := false
	// If the license is airgapped, we need to check the current period end date
	if api.IsAirgapped() && license.CurrentPeriodEndDate != nil {
		shouldDeactivate = time.Since(*license.CurrentPeriodEndDate) > 0
	} else {
		shouldDeactivate = license.LastVerifiedAt != nil && time.Since(*license.LastVerifiedAt) > verificationThreshhold
	}

	if err != nil {
		// The license sync failed, we need to check the last verified date
		if license.LastVerifiedAt != nil && license.ProductType != "FREE" {
			// Check if the last verified date is greater than 14 days
			if shouldDeactivate {
				// Deactivate the license
				newLicense := &db.License{
					ID:                     license.ID,
					LicenseKey:             license.LicenseKey,
					InstanceID:             license.InstanceID,
					WorkspaceID:            license.WorkspaceID,
					Product:                "Plane Free",
					ProductType:            "FREE",
					WorkspaceSlug:          license.WorkspaceSlug,
					Seats:                  0,
					FreeSeats:              12,
					Interval:               "MONTHLY",
					IsOfflinePayment:       false,
					IsCancelled:            false,
					Subscription:           "",
					CurrentPeriodEndDate:   nil,
					TrialEndDate:           nil,
					HasAddedPaymentMethod:  false,
					HasActivatedFreeTrial:  false,
					LastVerifiedAt:         license.LastVerifiedAt,
					LastPaymentFailedDate:  nil,
					LastPaymentFailedCount: 0,
				}

				// Update the license in the database
				// Update the existing license with the new data present
				if err := tx.Delete(&license).Error; err != nil {
					return nil, nil, err
				}

				if err := tx.Create(newLicense).Error; err != nil {
					return nil, nil, err
				}
				// Delete the existing members
				if err := tx.Where("license_id = ?", license.ID).Delete(&db.UserLicense{}).Error; err != nil {
					return nil, nil, err
				}

				// Delete the existing flags
				if err := tx.Where("license_id = ?", license.ID).Delete(&db.Flags{}).Error; err != nil {
					return nil, nil, err
				}

				return newLicense, &prime_api.WorkspaceActivationResponse{
					Product:          "Plane Free",
					ProductType:      "FREE",
					WorkspaceSlug:    license.WorkspaceSlug,
					Seats:            0,
					FreeSeats:        12,
					Interval:         "MONTHLY",
					IsOfflinePayment: false,
					IsCancelled:      false,
					MemberList:       []prime_api.WorkspaceMember{},
				}, nil
			}
		}
		// if the license is airgapped, we need to return nil, nil, nil
		if api.IsAirgapped() {
			return license, &prime_api.WorkspaceActivationResponse{
				Product:          license.Product,
				ProductType:      license.ProductType,
				WorkspaceSlug:    license.WorkspaceSlug,
				Seats:            license.Seats,
				FreeSeats:        license.FreeSeats,
				Interval:         license.Interval,
				IsOfflinePayment: license.IsOfflinePayment,
				IsCancelled:      license.IsCancelled,
				MemberList:       []prime_api.WorkspaceMember{},
			}, nil
		}
		return nil, nil, fmt.Errorf(F2_LICENSE_VERFICATION_FAILED, license.LicenseKey, license.WorkspaceSlug)
	}

	// Check for the current period end date
	var currentPeriodEndDate *time.Time
	if data.CurrentPeriodEndDate.IsZero() {
		currentPeriodEndDate = nil
	} else {
		currentPeriodEndDate = &data.CurrentPeriodEndDate
	}

	// Check for the trial end date
	var trialEndDate *time.Time
	if data.TrialEndDate.IsZero() {
		trialEndDate = nil
	} else {
		trialEndDate = &data.TrialEndDate
	}

	workspaceUUID, _ := uuid.Parse(data.WorkspaceID)
	instanceUUID, _ := uuid.Parse(data.InstanceID)

	now := time.Now()

	// Update the db for license with the new data
	licenseNew := &db.License{
		ID:                     license.ID,
		LicenseKey:             data.LicenceKey,
		InstanceID:             instanceUUID,
		WorkspaceID:            workspaceUUID,
		Product:                data.Product,
		ProductType:            data.ProductType,
		WorkspaceSlug:          data.WorkspaceSlug,
		Seats:                  data.Seats,
		FreeSeats:              data.FreeSeats,
		Interval:               data.Interval,
		IsOfflinePayment:       data.IsOfflinePayment,
		IsCancelled:            data.IsCancelled,
		Subscription:           data.Subscription,
		CurrentPeriodEndDate:   currentPeriodEndDate,
		TrialEndDate:           trialEndDate,
		HasAddedPaymentMethod:  data.HasAddedPayment,
		HasActivatedFreeTrial:  data.HasActivatedFree,
		LastVerifiedAt:         &now,
		LastPaymentFailedDate:  data.LastPaymentFailedDate,
		LastPaymentFailedCount: data.LastPaymentFailedCount,
	}

	// Update the existing license with the new data present
	if err := tx.Delete(&license).Error; err != nil {
		return nil, nil, err
	}

	if err := tx.Create(licenseNew).Error; err != nil {
		return nil, nil, err
	}

	// Return the response
	return licenseNew, data, nil
}

func RefreshLicenseUsers(ctx context.Context, license *db.License, activationReponse prime_api.WorkspaceActivationResponse, tx *gorm.DB) error {
	// If the license is paid, update the users with the member list provided
	if activationReponse.ProductType != "FREE" {
		// Get the members from the response
		members := activationReponse.MemberList

		// Delete the existing members
		if err := tx.Where("license_id = ?", license.ID).Delete(&db.UserLicense{}).Error; err != nil {
			return err
		}

		membersToPush := []db.UserLicense{}

		// Insert the new members
		for _, member := range members {
			userUUID, _ := uuid.Parse(member.UserId)
			memberData := db.UserLicense{
				UserID:    userUUID,
				LicenseID: license.ID,
				Role:      member.UserRole,
				Synced:    true,
				IsActive:  member.IsActive,
			}
			membersToPush = append(membersToPush, memberData)
		}

		// Bulk create the members inside the db
		if err := tx.CreateInBatches(membersToPush, 100).Error; err != nil {
			return err
		}
	}

	return nil
}

func RefreshFeatureFlags(ctx context.Context, api prime_api.IPrimeMonitorApi, license db.License, tx *gorm.DB) error {
	flags, err := api.GetFeatureFlags(license.LicenseKey)
	if err != nil {
		return fmt.Errorf(F2_LICENSE_VERFICATION_FAILED, license.LicenseKey, license.WorkspaceSlug)
	}

	flagData := db.Flags{
		LicenseID:  license.ID,
		Version:    flags.Version,
		AesKey:     flags.EncyptedData.AesKey,
		Nonce:      flags.EncyptedData.Nonce,
		CipherText: flags.EncyptedData.CipherText,
		Tag:        flags.EncyptedData.Tag,
	}

	if err := tx.Where("license_id = ?", license.ID).Delete(&db.Flags{}).Error; err != nil {
		return err
	}

	if err := tx.Create(&flagData).Error; err != nil {
		return err
	}

	return nil
}

func ConvertWorkspaceActivationResponseToLicense(data *prime_api.WorkspaceActivationResponse) (*db.License, error) {
	workspaceUUID, _ := uuid.Parse(data.WorkspaceID)
	instanceUUID, _ := uuid.Parse(data.InstanceID)

	// Check for the current period end date
	var currentPeriodEndDate *time.Time
	if data.CurrentPeriodEndDate.IsZero() {
		currentPeriodEndDate = nil
	} else {
		currentPeriodEndDate = &data.CurrentPeriodEndDate
	}

	// Check for the trial end date
	var trialEndDate *time.Time
	if data.TrialEndDate.IsZero() {
		trialEndDate = nil
	} else {
		trialEndDate = &data.TrialEndDate
	}

	now := time.Now()
	license := &db.License{
		LicenseKey:             data.LicenceKey,
		InstanceID:             instanceUUID,
		WorkspaceID:            workspaceUUID,
		Product:                data.Product,
		ProductType:            data.ProductType,
		WorkspaceSlug:          data.WorkspaceSlug,
		Seats:                  data.Seats,
		FreeSeats:              data.FreeSeats,
		Interval:               data.Interval,
		IsOfflinePayment:       data.IsOfflinePayment,
		IsCancelled:            data.IsCancelled,
		Subscription:           data.Subscription,
		CurrentPeriodEndDate:   currentPeriodEndDate,
		TrialEndDate:           trialEndDate,
		HasAddedPaymentMethod:  data.HasAddedPayment,
		HasActivatedFreeTrial:  data.HasActivatedFree,
		LastVerifiedAt:         &now,
		LastPaymentFailedDate:  data.LastPaymentFailedDate,
		LastPaymentFailedCount: data.LastPaymentFailedCount,
	}

	return license, nil
}

func ConvertLicenseToWorkspaceActivationPayload(license *db.License, userLicenses []db.UserLicense) (*prime_api.WorkspaceActivationPayload, error) {
	// Convert WorkspaceID to string
	workspaceIDStr := license.WorkspaceID.String()

	// Create MembersList from UserLicenses
	membersList := make([]prime_api.WorkspaceMember, len(userLicenses))
	for i, userLicense := range userLicenses {
		membersList[i] = prime_api.WorkspaceMember{
			UserId:   userLicense.UserID.String(),
			UserRole: userLicense.Role,
			IsActive: userLicense.IsActive,
		}
	}

	// Create and return the WorkspaceActivationPayload
	payload := &prime_api.WorkspaceActivationPayload{
		WorkspaceSlug: license.WorkspaceSlug,
		WorkspaceID:   workspaceIDStr,
		MembersList:   membersList,
		LicenceKey:    license.LicenseKey,
	}

	return payload, nil
}
