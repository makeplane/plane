package handlers

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
	"gorm.io/gorm"
)

func InitializeFreeWorkspace(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload prime_api.WorkspaceActivationPayload

		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace activation",
			})
			return err
		}

		// Check for the license and the workspace, if those are not present then
		// make the call and create the license and entities

		var workspaceLicense db.License
		record := db.Db.Model(&db.License{}).Where("workspace_id = ?", payload.WorkspaceID).First(&workspaceLicense)

		if record.Error != nil {
			return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
				"message": "Workspace activated successfully",
			})
		}

		data, err := api.ActivateFreeWorkspace(payload)

		if err != nil {
			data = &prime_api.WorkspaceActivationResponse{
				WorkspaceID:            payload.WorkspaceID,
				WorkspaceSlug:          workspaceLicense.WorkspaceSlug,
				InstanceID:             workspaceLicense.InstanceID.String(),
				LicenceKey:             workspaceLicense.LicenseKey,
				Product:                workspaceLicense.Product,
				ProductType:            workspaceLicense.ProductType,
				Seats:                  workspaceLicense.Seats,
				FreeSeats:              workspaceLicense.FreeSeats,
				Interval:               workspaceLicense.Interval,
				IsOfflinePayment:       workspaceLicense.IsOfflinePayment,
				IsCancelled:            workspaceLicense.IsCancelled,
				Subscription:           workspaceLicense.Subscription,
				CurrentPeriodEndDate:   time.Time{},
				TrialEndDate:           time.Time{},
				HasAddedPayment:        workspaceLicense.HasAddedPaymentMethod,
				HasActivatedFree:       workspaceLicense.HasActivatedFreeTrial,
				MemberList:             payload.MembersList,
				LastPaymentFailedDate:  workspaceLicense.LastPaymentFailedDate,
				LastPaymentFailedCount: workspaceLicense.LastPaymentFailedCount,
			}
		}

		license, _ := convertWorkspaceActivationResponseToLicense(data)
		db.Db.Create(license)

		// Send the workspace activation message back to the client
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Workspace activated successfully",
		})

		return nil
	}
}

func GetWorkspaceLicenseHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {
		// Get the data and fetch the license for the workspace

		workspaceId := ctx.Params("workspaceId")

		license := &db.License{}
		record := db.Db.Model(&db.License{}).Where("workspace_id = ?", workspaceId).First(&license)

		if record.Error != nil {
			ctx.Status(fiber.StatusOK).JSON(fiber.Map{
				"message": "No license found for the workspace",
				"status":  false,
			})
			return nil
		}

		// If the license is found return the license
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "License found for the workspace",
			"status":  true,
			"license": license,
		})

		return nil
	}
}

func GetSyncFeatureFlagHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload prime_api.WorkspaceSyncPayload

		// Parse the incoming payload
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace activation",
			})
			return err
		}

		workspaceLicense := &db.License{}
		record := db.Db.Model(&db.License{}).Where("workspace_id = ?", payload.WorkspaceID).First(&workspaceLicense)

		if record.Error != nil {
			ctx.Status(fiber.StatusOK).JSON(fiber.Map{
				"message": "No license found for the workspace",
				"status":  false,
			})
			return nil
		}

		payload.LicenceKey = workspaceLicense.LicenseKey
		data, err := api.SyncWorkspace(payload)

		isSynced := true

		if err != nil {
			data = &prime_api.WorkspaceActivationResponse{
				WorkspaceID:            payload.WorkspaceID,
				WorkspaceSlug:          workspaceLicense.WorkspaceSlug,
				InstanceID:             workspaceLicense.InstanceID.String(),
				LicenceKey:             workspaceLicense.LicenseKey,
				Product:                workspaceLicense.Product,
				ProductType:            workspaceLicense.ProductType,
				Seats:                  workspaceLicense.Seats,
				FreeSeats:              workspaceLicense.FreeSeats,
				Interval:               workspaceLicense.Interval,
				IsOfflinePayment:       workspaceLicense.IsOfflinePayment,
				IsCancelled:            workspaceLicense.IsCancelled,
				Subscription:           workspaceLicense.Subscription,
				CurrentPeriodEndDate:   time.Time{},
				TrialEndDate:           time.Time{},
				HasAddedPayment:        workspaceLicense.HasAddedPaymentMethod,
				HasActivatedFree:       workspaceLicense.HasActivatedFreeTrial,
				MemberList:             payload.MembersList,
				LastPaymentFailedDate:  workspaceLicense.LastPaymentFailedDate,
				LastPaymentFailedCount: workspaceLicense.LastPaymentFailedCount,
			}

			isSynced = false
		} else {
			// Update the existing license from the recieved data
			updateLicense, _ := convertWorkspaceActivationResponseToLicense(data)
			updateLicense.ID = workspaceLicense.ID

			if err := db.Db.Transaction(func(tx *gorm.DB) error {
				// Delete the existing license
				if err := tx.Delete(&workspaceLicense).Error; err != nil {
					return err
				}

				// Create the new license
				if err := tx.Create(updateLicense).Error; err != nil {
					return err
				}

				if updateLicense.ProductType != "FREE" {
					if err := RefreshFeatureFlags(context.Background(), api, *updateLicense, tx); err != nil {
						return err
					}
				}

				return nil
			}); err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Failed to update the workspace license",
				})
			}
		}

		// Fetch the license associated with the payload
		license := &db.License{}
		record = db.Db.Model(&db.License{}).Where("license_key = ?", data.LicenceKey).First(&license)
		if record.Error != nil {
			ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "License not found",
			})
			return nil
		}

		remainingSeats := license.Seats
		remainingFreeSeat := license.Seats * 5

		// Fetch existing users for the license
		var existingUsers []db.UserLicense
		db.Db.Model(&db.UserLicense{}).Where("license_id = ?", license.ID).Find(&existingUsers)

		// Create maps for both existing and new users
		existingUserMap := make(map[uuid.UUID]db.UserLicense)
		for _, user := range existingUsers {
			// If the user's role is greater than 10 in the existing users, than we
			// need to decrease the count of seats from the license
			if user.Role > 10 {
				if user.IsActive {
					remainingSeats = remainingSeats - 1
				}
			} else {
				// A free seat has been occupied
				if user.IsActive {
					remainingFreeSeat = remainingFreeSeat - 1
				}
			}
			existingUserMap[user.UserID] = user
		}

		newUserMap := make(map[uuid.UUID]prime_api.WorkspaceMember)
		for _, member := range data.MemberList {
			userUUID, _ := uuid.Parse(member.UserId)
			newUserMap[userUUID] = member
		}

		var addedUsers []prime_api.WorkspaceMember

		for _, member := range data.MemberList {
			userUUID, _ := uuid.Parse(member.UserId)
			if _, exists := existingUserMap[userUUID]; !exists {
				addedUsers = append(addedUsers, member)
			}
		}

		// Determine removed users
		var removedUsers []db.UserLicense
		for _, user := range existingUsers {
			if _, exists := newUserMap[user.UserID]; !exists {
				// If the removed user's role is greater than 10, then we can increase
				// the count of the remaining seat by 1, as one seat has been freed
				if user.Role > 10 {
					remainingSeats = remainingSeats + 1
				} else {
					// A free seat has been released
					remainingFreeSeat = remainingFreeSeat + 1
				}
				removedUsers = append(removedUsers, user)
			}
		}

		// Remove the removed users from the database
		for _, user := range removedUsers {
			db.Db.Delete(&user)
		}

		if license.ProductType == "PRO" || license.ProductType == "BUSINESS" || license.ProductType == "ENTERPRISE" {
			for _, user := range addedUsers {
				userUUID, _ := uuid.Parse(user.UserId)
				// A user can be added in active mode, if there are seats available
				// If the user is new, we need to add them to the database
				isActive := false
				if user.UserRole > 10 {
					// If the user's role is greater than 10, we need to check if there are
					// seats available for the user
					if remainingSeats > 0 {
						isActive = true
						// A seat has been taken by this user
						remainingSeats = remainingSeats - 1
					}
				} else {
					if remainingFreeSeat > 0 {
						isActive = true
						// A seat has been occupied by a free user
						remainingFreeSeat = remainingFreeSeat - 1
					}
				}

				db.Db.Create(&db.UserLicense{
					UserID:    userUUID,
					LicenseID: license.ID,
					Role:      user.UserRole,
					Synced:    isSynced,
					IsActive:  isActive,
				})
			}

			// Check the availability of seats
			if remainingSeats > 0 {
				// Check if there is a users, which is in inactive mode, we can make it
				// consume a seat and release the remaining seats
				for _, user := range existingUsers {
					if user.Role > 10 && !user.IsActive && !containsUser(removedUsers, user.UserID) {
						user.IsActive = true
						db.Db.Save(&user)
						remainingSeats = remainingSeats - 1
					}
				}
			}

			if remainingFreeSeat > 0 {
				// Check if there are users with role less than 10, in inactive mode, we
				// can give them the seat and try to make the remainingFreeSeat count to 0
				for _, user := range existingUsers {
					if user.Role <= 10 && !user.IsActive && !containsUser(removedUsers, user.UserID) {
						user.IsActive = true
						db.Db.Save(&user)
						remainingFreeSeat = remainingFreeSeat - 1
					}
				}
			}
		} else {
			// If the product type is free or one, there is no limitation on the
			// number of seats, so we can add all the users
			if license.ProductType != "FREE" {

				isActive := false
				if license.ProductType == "ONE" {
					isActive = true
				}

				for _, user := range addedUsers {
					userUUID, _ := uuid.Parse(user.UserId)
					db.Db.Create(&db.UserLicense{
						UserID:    userUUID,
						LicenseID: license.ID,
						Role:      user.UserRole,
						Synced:    isSynced,
						IsActive:  isActive,
					})
				}
			}
		}

		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Workspace synchronized successfully",
		})
		return nil
	}
}

type ManualSyncPayload struct {
	WorkspaceSlug string `json:"workspace_slug"`
	WorkspaceId   string `json:"workspace_id"`
}

func GetManualSyncHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload ManualSyncPayload

		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace activation",
			})
			return err
		}

		// get the license for the given workspace id and workspace slug
		license := &db.License{}
		record := db.Db.Model(&db.License{}).Where("workspace_id = ? AND workspace_slug = ?", payload.WorkspaceId, payload.WorkspaceSlug).First(&license)

		if record.Error != nil {
			ctx.Status(fiber.StatusOK).JSON(fiber.Map{
				"message": "No license found for the workspace",
				"status":  false,
			})
			return nil
		}

		if license.ProductType == "FREE" {
			return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
				"message": "Workspace synchronized successfully",
			})
		}

		err := db.Db.Transaction(func(tx *gorm.DB) error {
			updatedLicense, activationReponse, err := RefreshLicense(context.Background(), api, license, tx)
			if err != nil {
				return err
			}

			if err := RefreshLicenseUsers(context.Background(), updatedLicense, *activationReponse, tx); err != nil {
				return err
			}

			if updatedLicense.ProductType != "FREE" {
				if err := RefreshFeatureFlags(context.Background(), api, *updatedLicense, tx); err != nil {
					return err
				}
			}

			return nil
		})

		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Failed to sync the workspace",
			})
		}

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Workspace synchronized successfully",
		})
	}
}

func GetActivateFeatureFlagHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		// Get the data from the request and forward the request to the API
		var payload prime_api.WorkspaceActivationPayload

		// Validate the payload sent from the client
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace activation",
			})
			return err
		}

		// Forward the payload to the API and get the response
		data, err := api.ActivateWorkspace(payload)

		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error,
			})
		}

		workspaceUUID, _ := uuid.Parse(data.WorkspaceID)
		license, _ := convertWorkspaceActivationResponseToLicense(data)

		// Remove the existing license for the workspace
		db.Db.Where("workspace_id = ?", workspaceUUID).Delete(&db.License{})

		// Create the license for the workspace
		db.Db.Create(license)

		// Create the members for the workspace
		members := make([]db.UserLicense, 0)
		for _, member := range data.MemberList {
			userUUID, _ := uuid.Parse(member.UserId)
			members = append(members, db.UserLicense{
				UserID:    userUUID,
				LicenseID: license.ID,
				Role:      member.UserRole,
				Synced:    true,
				IsActive:  member.IsActive,
			})
		}
		db.Db.CreateInBatches(members, 100)

		flags, err := api.GetFeatureFlags(data.LicenceKey)

		if err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error,
			})
			return fmt.Errorf("failed to get feature flags: %v", err)
		}

		flagData := &db.Flags{
			LicenseID:  license.ID,
			Version:    flags.Version,
			AesKey:     flags.EncyptedData.AesKey,
			Nonce:      flags.EncyptedData.Nonce,
			CipherText: flags.EncyptedData.CipherText,
			Tag:        flags.EncyptedData.Tag,
		}
		db.Db.Create(flagData)

		// Send the workspace activation message back to the client
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "License activated successfully for the workspace",
			"status":  true,
			"license": license,
		})

		return nil
	}
}

// Helper function to check if a user is in the removed users list
func containsUser(users []db.UserLicense, userID uuid.UUID) bool {
	for _, user := range users {
		if user.UserID == userID {
			return true
		}
	}
	return false
}

type UpdateSeatsPayload struct {
	WorkspaceSlug string `json:"workspace_slug"`
	WorkspaceId   string `json:"workspace_id"`
	Quantity      int64  `json:"quantity"`
}

func UpdateLicenseSeats(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload UpdateSeatsPayload

		// Parse the incoming payload
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for license update",
			})
			return err
		}

		// Find the license associated with the worksapce id and workspace slug
		var license db.License
		record := db.Db.Model(&db.License{}).Where("workspace_id = ? AND workspace_slug = ?", payload.WorkspaceId, payload.WorkspaceSlug).First(&license)

		if record.Error != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "No license exist for corresponding workspace sent.",
			})
		}

		// Update prime with the quantity asked
		data, err := api.UpdateSubcription(prime_api.SeatUpdatePayload{
			WorkspaceSlug: license.WorkspaceSlug,
			WorkspaceId:   license.WorkspaceID.String(),
			Quantity:      payload.Quantity,
			LicenseKey:    license.LicenseKey,
		})

		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error,
			})
		}

		// Update the license with the new data
		license.Seats = int(data.Seats)
		db.Db.Save(&license)

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"seats": license.Seats,
		})
	}
}

type DeactivateLicensePayload struct {
	WorkspaceSlug string `json:"workspace_slug"`
	WorkspaceId   string `json:"workspace_id"`
}

func DeactivateLicense(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		var payload DeactivateLicensePayload

		// Parse the incoming payload
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for license deactivation",
			})
			return err
		}

		// Find the license associated with the worksapce id and workspace slug
		var license db.License
		record := db.Db.Model(&db.License{}).Where("workspace_id = ? AND workspace_slug = ?", payload.WorkspaceId, payload.WorkspaceSlug).First(&license)

		if record.Error != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "No license exist for corresponding workspace sent.",
			})
		}

		freeLicensePayload, fetchError := api.DeactivateLicense(prime_api.LicenseDeactivatePayload{
			WorkspaceSlug: license.WorkspaceSlug,
			WorkspaceID:   license.WorkspaceID.String(),
			LicenseKey:    license.LicenseKey,
		})

		if fetchError != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": fetchError.Error,
			})
		}

		// Create a transaction for clearing the license, flags and license users
		err := db.Db.Transaction(func(tx *gorm.DB) error {
			// Clear the license and license users
			db.Db.Delete(&license)
			db.Db.Where("license_id = ?", license.ID).Delete(&db.Flags{})
			db.Db.Where("license_id = ?", license.ID).Delete(&db.UserLicense{})
			return nil
		})

		if err != nil {
			// @todo Link the license back to the prime server

			members := []db.UserLicense{}
			if err := db.Db.Where("license_id = ?", license.ID).Find(&members).Error; err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Failed to fetch the members for reactivating workspace",
				})
			}

			// Create the payload for reactivating the license
			reactivatePayload, err := convertLicenseToWorkspaceActivationPayload(&license, members)
			if err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Failed to convert the license to workspace activation payload",
				})
			}

			// Finally reactivate the workspace
			_, errCode := api.ActivateWorkspace(*reactivatePayload)

			if errCode != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Failed to reactivate the workspace, after failed deactivation at monitor",
				})
			}

			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Failed to deactivate the license",
			})
		}

		freeLicense, err := convertWorkspaceActivationResponseToLicense(freeLicensePayload)

		if err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Failed to convert the free license",
			})
		}

		// Create the free license for the workspace
		db.Db.Create(freeLicense)

		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "License deactivated successfully",
		})
	}
}

func CheckDeleteWorkspaceProductHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {
		// Get the workspace id from the URL
		workspaceId := ctx.Params("workspaceId")

		license := &db.License{}
		record := db.Db.Model(&db.License{}).Where("workspace_id = ?", workspaceId).First(&license)

		if record.Error != nil {
			ctx.Status(fiber.StatusOK).JSON(fiber.Map{
				"message": "No license found for the workspace",
				"status":  true,
			})
			return nil
		}

		if license.ProductType != "FREE" {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"message": "Workspace is not on a free plan",
				"status":  false,
			})
			return nil
		}

		// Send the response back to the client
		return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"message": "Workspace is on a free plan",
			"status":  true,
		})
	}
}
