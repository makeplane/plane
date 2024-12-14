package handlers

import (
	"context"

	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/lib/logger"
	"github.com/makeplane/plane-ee/monitor/lib/router"
)

type HTTPHandler struct {
	Host   string
	Port   string
	logger logger.Handler
	router *router.MonitorRouter
}

type HTTPHandlerOptions struct {
	Api        *prime_api.IPrimeMonitorApi
	Host       string
	Port       string
	Logger     logger.Handler
	PrivateKey string
}

func NewHttpHandler(options HTTPHandlerOptions) *HTTPHandler {
	router := router.NewMonitorRouter(router.MonitorRouterOptions{
		Logger:     &options.Logger,
		AppName:    "Monitor",
		Api:        options.Api,
		PrivateKey: options.PrivateKey,
	})
	router.SetLogger(options.Logger)
	return &HTTPHandler{
		router: router,
		Host:   options.Host,
		Port:   options.Port,
		logger: options.Logger,
	}
}

func (h *HTTPHandler) StartHttpServer(ctx context.Context) {
	done := make(chan bool)
	defer close(done)

	go func() {
		h.router.Start(h.Host, h.Port)
		done <- true
	}()

	select {
	case <-ctx.Done():
		return
	case <-done:
		return
	}
}
