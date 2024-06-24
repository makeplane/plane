package handlers

import (
	"context"

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
	Host   string
	Port   string
	Logger logger.Handler
}

func NewHttpHandler(options HTTPHandlerOptions) *HTTPHandler {
	router := router.NewMonitorRouter(router.MonitorRouterOptions{
		Logger: &options.Logger,
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
