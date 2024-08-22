package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"
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
			ctx.Status(fiber.StatusOK)
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
