package router

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cache"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	primelogger "github.com/makeplane/plane-ee/monitor/lib/logger"
	"github.com/makeplane/plane-ee/monitor/lib/router/routes"
)

type MonitorRouter struct {
	app    *fiber.App
	logger *primelogger.Handler
}

// Takes MonitorRouterOptions and returns a new monitor router pointer,
// initialized with those options
func NewMonitorRouter(config MonitorRouterOptions) *MonitorRouter {
	// Set the config to the default options
	cfg := defaultRouterOptions

	// If the length of the config is greater that one than we set the cfg to the
	// config that is provided inside the arguments.
	// Create a new app router based on the cfg provided
	app := fiber.New(
		fiber.Config{
			AppName:           cfg.AppName,
			Immutable:         false,
			JSONEncoder:       cfg.Encoder,
			JSONDecoder:       cfg.Decoder,
			DisableKeepalive:  cfg.DisableKeepAlive,
			ReduceMemoryUsage: cfg.ReduceMemoryUsage,
		},
	)

	router := &MonitorRouter{
		app:    app,
		logger: config.Logger,
	}
	router.bindRoutes(config.Api, config.PrivateKey)
	router.bindMiddlewares()

	return router
}

func (r *MonitorRouter) SetLogger(logger primelogger.Handler) {
	r.logger = &logger
}

// ------------------ Orchestration Methods ----------------------
func (r *MonitorRouter) Start(host string, port string) error {
	if err := r.app.Listen(fmt.Sprintf("%s:%s", host, port)); err != nil {
		return err
	}
	return nil
}

func (r *MonitorRouter) Stop() error {
	if err := r.app.ShutdownWithTimeout(5 * time.Second); err != nil {
		return err
	}
	return nil
}

// ----------------------- Fiber App Binding ---------------------
func (r *MonitorRouter) bindRoutes(api *prime_api.IPrimeMonitorApi, privateKey string) {
	v1 := r.app.Group("/api")
	routes.RegisterDnsRoute(&v1, r.logger)
	routes.RegisterFeatureFlags(&v1, r.logger, api, privateKey)
}

func (r *MonitorRouter) bindMiddlewares() {

	r.app.Use(cache.New(cache.Config{
		Next: func(c *fiber.Ctx) bool {
			return c.Query("noCache") == "true"
		},
		Expiration:   30 * time.Minute,
		CacheControl: true,
	}))

	r.app.Use(func(c *fiber.Ctx) error {
		c.Accepts(fiber.MIMEApplicationJSONCharsetUTF8)
		return c.Next()
	})

	r.app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
	}))

	r.app.Use(logger.New(logger.Config{
		Output: dummyWriter{},
		Done: func(c *fiber.Ctx, logString []byte) {
			if c.Response().StatusCode() == fiber.StatusOK {
				r.logger.Info(context.Background(), "[HTTP ROUTER] "+strings.ReplaceAll(string(logString), "\n", ""))
			} else {
				r.logger.Error(context.Background(), "[HTTP ROUTER] "+strings.ReplaceAll(string(logString), "\n", ""))
			}
		},
	}))
}
