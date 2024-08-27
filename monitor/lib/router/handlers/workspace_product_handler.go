package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
)

type WorkspaceProductResponse struct {
	// Product Type will be mapped as Plane below
	Plan                 string     `json:"plan"`
	PurchasedSeats       int        `json:"purchased_seats"`
	FreeSeats            int        `json:"free_seats"`
	CurrentPeriodEndDate *time.Time `json:"current_period_end_date"`
	IsCancelled          bool       `json:"is_cancelled"`
	Interval             string     `json:"interval"`
	IsOfflinePayment     bool       `json:"is_offline_payment"`
	TrialEndDate         *time.Time `json:"trial_end_date"`
	HasAddedPayment      bool       `json:"has_added_payment_method"`
	HasActivatedFree     bool       `json:"has_activated_free_trial"`
	Subscription         string     `json:"subscription"`
}

func GetWorkspaceProductHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {

		var payload prime_api.WorkspaceProductPayload

		// Validate the payload sent from the client
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace product",
			})
			return err
		}

		// Get the parameter workspace id from the URL
		workspaceId := ctx.Params("workspaceId")
		if workspaceId == "" {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid workspace id",
			})
		}

		// Get the license record for the workspace
		license := db.License{}
		record := db.Db.Model(&db.License{}).Where("workspace_id = ? AND workspace_slug = ?", workspaceId, payload.WorkspaceSlug).First(&license)

		if record.Error != nil {
			// If the record is not found, create a free workspace on the prime server
			/**
			We are trying to hit this endpoint in the case when we don't know the product of the license we initiate the free workspace with prime the prime returns us with the
			license details and the product type according to which we proceed with creating users and fetching the feature flags.
			*/
			data, err := api.ActivateFreeWorkspace(prime_api.WorkspaceActivationPayload{
				WorkspaceSlug: payload.WorkspaceSlug,
				WorkspaceID:   workspaceId,
				MembersList:   payload.MembersList,
				OwnerEmail:    payload.OwnerEmail,
			})

			// If the workspace could not be created, return a free workspace
			if err != 0 {
				// Send the response back to the client
				ctx.Status(fiber.StatusOK).JSON(WorkspaceProductResponse{
					Plan:                 "FREE",
					PurchasedSeats:       0,
					FreeSeats:            payload.FreeSeats,
					CurrentPeriodEndDate: nil,
					IsCancelled:          false,
					Interval:             "MONTHLY",
					IsOfflinePayment:     false,
					HasAddedPayment:      false,
					HasActivatedFree:     false,
				})
				// Return the error
				return fmt.Errorf("failed to activate workspace: %v", err)
			}

			// Parse the string to uuids
			workspaceUUID, _ := uuid.Parse(data.WorkspaceID)
			instanceUUID, _ := uuid.Parse(data.InstanceID)

			// Create a new license record for the workspace
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
			// Save the license record to the database
			db.Db.Create(license)

			// Fetch the feature flags if the product is not free
			if data.ProductType != "FREE" {
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

			// Send the response back to the client
			ctx.Status(fiber.StatusOK).JSON(WorkspaceProductResponse{
				Plan:                 license.ProductType,
				PurchasedSeats:       license.Seats,
				FreeSeats:            license.FreeSeats,
				CurrentPeriodEndDate: license.CurrentPeriodEndDate,
				IsCancelled:          license.IsCancelled,
				Interval:             license.Interval,
				IsOfflinePayment:     license.IsOfflinePayment,
				TrialEndDate:         license.TrialEndDate,
				HasAddedPayment:      license.HasAddedPaymentMethod,
				HasActivatedFree:     license.HasActivatedFreeTrial,
				Subscription:         license.Subscription,
			})

			return nil
		}

		// Send the response back to the client
		ctx.Status(fiber.StatusOK).JSON(WorkspaceProductResponse{
			Plan:                 license.ProductType,
			PurchasedSeats:       license.Seats,
			FreeSeats:            license.FreeSeats,
			CurrentPeriodEndDate: license.CurrentPeriodEndDate,
			IsCancelled:          license.IsCancelled,
			Interval:             license.Interval,
			IsOfflinePayment:     license.IsOfflinePayment,
			TrialEndDate:         license.TrialEndDate,
			HasAddedPayment:      license.HasAddedPaymentMethod,
			HasActivatedFree:     license.HasActivatedFreeTrial,
			Subscription:         license.Subscription,
		})

		return nil
	}
}
