package handlers

import (
	"github.com/gofiber/fiber/v2"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/pkg/db"
)

func GetInstanceLicenses(api prime_api.IPrimeMonitorApi, key string) func(*fiber.Ctx) error {
	return func(ctx *fiber.Ctx) error {
		// Initialize the variables
		var exists bool

		// Check if the product type is PRO or ONE on any of the licenses
		record := db.Db.Model(&db.License{}).
			Where("product_type IN ?", []string{"PRO", "ONE", "BUSINESS", "ENTERPRISE"}).Select("1").Limit(1).Find(&exists)

		// If there is an error, return false
		if record.Error != nil {
			ctx.Status(fiber.StatusOK).JSON(fiber.Map{
				"values": false,
			})
			return nil
		}

		// If the product type is not PRO or ONE, return false
		ctx.Status(fiber.StatusOK).JSON(fiber.Map{
			"values": exists,
		})
		return nil
	}
}
