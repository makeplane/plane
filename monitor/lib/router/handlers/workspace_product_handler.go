package handlers

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
	"gorm.io/gorm"
)

type WorkspaceProductResponse struct {
	// Product Type will be mapped as Plane below
	Plan                   string     `json:"plan"`
	PurchasedSeats         int        `json:"purchased_seats"`
	FreeSeats              int        `json:"free_seats"`
	CurrentPeriodEndDate   *time.Time `json:"current_period_end_date"`
	IsCancelled            bool       `json:"is_cancelled"`
	Interval               string     `json:"interval"`
	IsOfflinePayment       bool       `json:"is_offline_payment"`
	TrialEndDate           *time.Time `json:"trial_end_date"`
	HasAddedPayment        bool       `json:"has_added_payment_method"`
	HasActivatedFree       bool       `json:"has_activated_free_trial"`
	Subscription           string     `json:"subscription"`
	LastVerifiedAt         *time.Time `json:"last_verified_at"`
	LastPaymentFailedDate  *time.Time `json:"last_payment_failed_date"`
	LastPaymentFailedCount int        `json:"last_payment_failed_count"`
}

type WorkspaceSubscriptionPayload struct {
	WorkspaceId string `json:"workspace_id"`
}

type ProrationPreviewPayload struct {
	WorkspaceId   string `json:"workspace_id"`
	Quantity      int    `json:"quantity"`
	WorkspaceSlug string `json:"workspace_slug"`
}

func GetWorkspaceProductHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {

		var payload prime_api.WorkspaceProductPayload

		// Validate the payload sent from the client
		if err := ctx.BodyParser(&payload); err != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace product",
			})
		}

		// Get the parameter workspace id from the URL
		workspaceId := ctx.Params("workspaceId")
		if workspaceId == "" {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid workspace id",
			})
		}

		// Get the license record for the workspace
		license := db.License{}
		record := db.Db.Model(&db.License{}).Where("workspace_id = ? AND workspace_slug = ?", workspaceId, payload.WorkspaceSlug).First(&license)

		isAirgapped := api.IsAirgapped()

		if record.Error != nil {
			// If the record is not found, create a free workspace on the prime server
			/**
			We are trying to hit this endpoint in the case when we don't know the product of the license we initiate the free workspace with prime the prime returns us with the
			license details and the product type according to which we proceed with creating users and fetching the feature flags.
			*/

			var data *prime_api.WorkspaceActivationResponse
			var apiError *prime_api.APIError

			if isAirgapped {
				data, apiError = api.SyncWorkspace(prime_api.WorkspaceSyncPayload{
					WorkspaceSlug: payload.WorkspaceSlug,
					WorkspaceID:   workspaceId,
					MembersList:   payload.MembersList,
				})
			} else {
				data, apiError = api.ActivateFreeWorkspace(prime_api.WorkspaceActivationPayload{
					WorkspaceSlug: payload.WorkspaceSlug,
					WorkspaceID:   workspaceId,
					MembersList:   payload.MembersList,
					OwnerEmail:    payload.OwnerEmail,
				})
			}

			// If the workspace could not be created, return a free workspace
			if apiError != nil {
				now := time.Now()
				// Send the response back to the client
				ctx.Status(fiber.StatusOK).JSON(WorkspaceProductResponse{
					Plan:                   "FREE",
					PurchasedSeats:         0,
					FreeSeats:              payload.FreeSeats,
					CurrentPeriodEndDate:   nil,
					IsCancelled:            false,
					Interval:               "MONTHLY",
					IsOfflinePayment:       false,
					HasAddedPayment:        false,
					HasActivatedFree:       false,
					LastVerifiedAt:         &now,
					LastPaymentFailedDate:  nil,
					LastPaymentFailedCount: 0,
				})
				// Return the error
				return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": apiError.Error,
				})
			}

			// Parse the string to uuids
			workspaceUUID, _ := uuid.Parse(data.WorkspaceID)
			instanceUUID, _ := uuid.Parse(data.InstanceID)
			now := time.Now()
			// Create a new license record for the workspace
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
				HasAddedPaymentMethod:  data.HasAddedPayment,
				HasActivatedFreeTrial:  data.HasActivatedFree,
				LastVerifiedAt:         &now,
				LastPaymentFailedDate:  data.LastPaymentFailedDate,
				LastPaymentFailedCount: data.LastPaymentFailedCount,
			}
			// Save the license record to the database

			members := make([]db.UserLicense, 0)
			var flagData *db.Flags

			if data.ProductType != "FREE" {
				// Create the members for the workspace
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
				var flags *prime_api.FlagDataResponse

				if isAirgapped {
					flags = &prime_api.FlagDataResponse{
						Version: data.Flags.Version,
						EncyptedData: prime_api.EncyptedFlagData{
							AesKey:     data.Flags.AesKey,
							Nonce:      data.Flags.Nonce,
							CipherText: data.Flags.CipherText,
							Tag:        data.Flags.Tag,
						},
					}
				} else {
					flags, apiError = api.GetFeatureFlags(data.LicenceKey)
					if apiError != nil {
						return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
							"error": apiError.Error,
						})
					}
				}

				flagData = &db.Flags{
					LicenseID:  license.ID,
					Version:    flags.Version,
					AesKey:     flags.EncyptedData.AesKey,
					Nonce:      flags.EncyptedData.Nonce,
					CipherText: flags.EncyptedData.CipherText,
					Tag:        flags.EncyptedData.Tag,
				}
			}

			err := db.Db.Transaction(func(tx *gorm.DB) error {
				tx.Create(license)
				tx.CreateInBatches(members, 100)
				tx.Create(flagData)
				return nil
			})

			if err != nil {
				return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": err.Error(),
				})
			}

			if data.ProductType != "FREE" {
				// Send the workspace activation message back to the client
				return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
					"message": "License activated successfully for the workspace",
					"status":  true,
					"license": license,
				})
			}

			// Fetch the feature flags if the product is not free

			// Send the response back to the client
			ctx.Status(fiber.StatusOK).JSON(WorkspaceProductResponse{
				Plan:                   license.ProductType,
				PurchasedSeats:         license.Seats,
				FreeSeats:              license.FreeSeats,
				CurrentPeriodEndDate:   license.CurrentPeriodEndDate,
				IsCancelled:            license.IsCancelled,
				Interval:               license.Interval,
				IsOfflinePayment:       license.IsOfflinePayment,
				TrialEndDate:           license.TrialEndDate,
				HasAddedPayment:        license.HasAddedPaymentMethod,
				HasActivatedFree:       license.HasActivatedFreeTrial,
				Subscription:           license.Subscription,
				LastVerifiedAt:         license.LastVerifiedAt,
				LastPaymentFailedDate:  license.LastPaymentFailedDate,
				LastPaymentFailedCount: license.LastPaymentFailedCount,
			})

			return nil
		}

		// Send the response back to the client
		return ctx.Status(fiber.StatusOK).JSON(WorkspaceProductResponse{
			Plan:                   license.ProductType,
			PurchasedSeats:         license.Seats,
			FreeSeats:              license.FreeSeats,
			CurrentPeriodEndDate:   license.CurrentPeriodEndDate,
			IsCancelled:            license.IsCancelled,
			Interval:               license.Interval,
			IsOfflinePayment:       license.IsOfflinePayment,
			TrialEndDate:           license.TrialEndDate,
			HasAddedPayment:        license.HasAddedPaymentMethod,
			HasActivatedFree:       license.HasActivatedFreeTrial,
			Subscription:           license.Subscription,
			LastVerifiedAt:         license.LastVerifiedAt,
			LastPaymentFailedDate:  license.LastPaymentFailedDate,
			LastPaymentFailedCount: license.LastPaymentFailedCount,
		})
	}
}

func GetWorkspaceSubscriptionHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {

		//Parse the payload

		var payload WorkspaceSubscriptionPayload

		// Validate the payload sent from the client
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace product",
			})
			return err
		}

		// Get the license record for the workspace
		license := db.License{}
		record := db.Db.Model(&db.License{}).Where("workspace_id = ?", payload.WorkspaceId).First(&license)

		if record.Error != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid workspace id",
			})
		}

		// Get the subscription details for the workspace from the prime server
		data, errorResponse := api.GetSubscriptionDetails(prime_api.WorkspaceSubscriptionPayload{
			WorkspaceId: license.WorkspaceID.String(),
			LicenseKey:  license.LicenseKey,
		})

		if errorResponse != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": errorResponse.Error,
			})
		}

		// Send the response back to the client
		return ctx.Status(fiber.StatusOK).JSON(data)
	}
}

func GetPlansHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {
		// Get params from the URL
		quantity := ctx.Params("quantity", "1")

		// Get the plans from the prime server
		data, errorResponse := api.RetrievePlans(quantity)

		if errorResponse != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": errorResponse.Error,
			})
		}

		// Send the response back to the client
		return ctx.Status(fiber.StatusOK).JSON(data)
	}
}

func GetPaymentLinkHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {
		var payload prime_api.RetrievePaymentLinkPayload

		// Validate the payload sent from the client
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace product",
			})
			return err
		}
		// Get the payment link from the prime server
		data, errorResponse := api.RetrievePaymentLink(payload)

		if errorResponse != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": errorResponse.Error,
			})
			return fmt.Errorf("failed to get payment link: %v", errorResponse)
		}

		// Send the response back to the client
		return ctx.Status(fiber.StatusOK).JSON(data)
	}
}

func GetProrationPreviewHandler(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) (err error) {
		//Parse the payload

		var payload ProrationPreviewPayload

		// Validate the payload sent from the client
		if err := ctx.BodyParser(&payload); err != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid payload passed for workspace product",
			})
			return err
		}

		// Get the license record for the workspace
		license := db.License{}
		record := db.Db.Model(&db.License{}).Where("workspace_id = ?", payload.WorkspaceId).First(&license)

		// If the license record is not found, return an error
		if record.Error != nil {
			ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid workspace id",
			})
			return err
		}

		// Get the proration preview from the prime server
		data, errorResponse := api.GetProrationPreview(prime_api.ProrationPreviewPayload{
			WorkspaceId:   license.WorkspaceID.String(),
			LicenseKey:    license.LicenseKey,
			WorkspaceSlug: payload.WorkspaceSlug,
			Quantity:      payload.Quantity,
		})

		if errorResponse != nil {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": errorResponse.Error,
			})
		}

		// Send the response back to the client
		return ctx.Status(fiber.StatusOK).JSON(data)
	}
}
