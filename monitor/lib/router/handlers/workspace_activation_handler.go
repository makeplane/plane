package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
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

		if err != 0 {
			data = &prime_api.WorkspaceActivationResponse{
				WorkspaceID:          payload.WorkspaceID,
				WorkspaceSlug:        workspaceLicense.WorkspaceSlug,
				InstanceID:           workspaceLicense.InstanceID.String(),
				LicenceKey:           workspaceLicense.LicenseKey,
				Product:              workspaceLicense.Product,
				ProductType:          workspaceLicense.ProductType,
				Seats:                workspaceLicense.Seats,
				FreeSeats:            workspaceLicense.FreeSeats,
				Interval:             workspaceLicense.Interval,
				IsOfflinePayment:     workspaceLicense.IsOfflinePayment,
				IsCancelled:          workspaceLicense.IsCancelled,
				Subscription:         workspaceLicense.Subscription,
				CurrentPeriodEndDate: time.Time{},
				TrialEndDate:         time.Time{},
				HasAddedPayment:      workspaceLicense.HasAddedPaymentMethod,
				HasActivatedFree:     workspaceLicense.HasActivatedFreeTrial,
				MemberList:           payload.MembersList,
			}
		}

		workspaceUUID, _ := uuid.Parse(data.WorkspaceID)
		instanceUUID, _ := uuid.Parse(data.InstanceID)

		license := &db.License{
			LicenseKey:            data.LicenceKey,
			InstanceID:            instanceUUID,
			WorkspaceID:           workspaceUUID,
			Product:               data.Product,
			ProductType:           data.ProductType,
			WorkspaceSlug:         data.WorkspaceSlug,
			Seats:                 data.Seats,
			FreeSeats:             data.FreeSeats,
			Interval:              data.Interval,
			IsOfflinePayment:      data.IsOfflinePayment,
			IsCancelled:           data.IsCancelled,
			Subscription:          data.Subscription,
			HasAddedPaymentMethod: data.HasAddedPayment,
			HasActivatedFreeTrial: data.HasActivatedFree,
		}
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

		if err != 0 {
			data = &prime_api.WorkspaceActivationResponse{
				WorkspaceID:          payload.WorkspaceID,
				WorkspaceSlug:        workspaceLicense.WorkspaceSlug,
				InstanceID:           workspaceLicense.InstanceID.String(),
				LicenceKey:           workspaceLicense.LicenseKey,
				Product:              workspaceLicense.Product,
				ProductType:          workspaceLicense.ProductType,
				Seats:                workspaceLicense.Seats,
				FreeSeats:            workspaceLicense.FreeSeats,
				Interval:             workspaceLicense.Interval,
				IsOfflinePayment:     workspaceLicense.IsOfflinePayment,
				IsCancelled:          workspaceLicense.IsCancelled,
				Subscription:         workspaceLicense.Subscription,
				CurrentPeriodEndDate: time.Time{},
				TrialEndDate:         time.Time{},
				HasAddedPayment:      workspaceLicense.HasAddedPaymentMethod,
				HasActivatedFree:     workspaceLicense.HasActivatedFreeTrial,
				MemberList:           payload.MembersList,
			}

			isSynced = false
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

		if license.ProductType == "PRO" {
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

		if err != 0 {
			ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to activate workspace",
			})
			return fmt.Errorf("failed to activate workspace: %v", err)
		}

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

		license := &db.License{
			LicenseKey:            data.LicenceKey,
			InstanceID:            instanceUUID,
			WorkspaceID:           workspaceUUID,
			Product:               data.Product,
			ProductType:           data.ProductType,
			WorkspaceSlug:         data.WorkspaceSlug,
			Seats:                 data.Seats,
			FreeSeats:             data.FreeSeats,
			Interval:              data.Interval,
			IsOfflinePayment:      data.IsOfflinePayment,
			IsCancelled:           data.IsCancelled,
			Subscription:          data.Subscription,
			CurrentPeriodEndDate:  currentPeriodEndDate,
			TrialEndDate:          trialEndDate,
			HasAddedPaymentMethod: data.HasAddedPayment,
			HasActivatedFreeTrial: data.HasActivatedFree,
		}
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

		if err != 0 {
			ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to get feature flags",
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
