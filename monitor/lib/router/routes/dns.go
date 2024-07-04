package routes

import (
	"context"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	primelogger "github.com/makeplane/plane-ee/monitor/lib/logger"
	"github.com/makeplane/plane-ee/monitor/lib/router/handlers"
	"strings"
)

type dummyWriter struct{}

func (w dummyWriter) Write(b []byte) (int, error) {
	return 0, nil
}

func RegisterDnsRoute(router *fiber.Router, plogger *primelogger.Handler) {
	dnsController := fiber.New()
	dnsController.Use(logger.New(logger.Config{
		Output: dummyWriter{},
		Done: func(c *fiber.Ctx, logString []byte) {
			if c.Response().StatusCode() == fiber.StatusOK {
				plogger.Info(context.Background(), "[HTTP ROUTER] "+strings.ReplaceAll(string(logString), "\n", ""))
			} else {
				plogger.Error(context.Background(), "[HTTP ROUTER] "+strings.ReplaceAll(string(logString), "\n", ""))
			}
		},
	}))

	(*router).Mount("/dns", dnsController)

	addDnsRoutes(dnsController)

}

func addDnsRoutes(dnsController *fiber.App) {
	dnsController.Post("/validate/", handlers.DNSValidationHandler)
}
