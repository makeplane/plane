package core

import (
	"context"
	"fmt"
	"strings"

	prime_api "github.com/makeplane/plane-ee/monitor/lib/api"
	"github.com/makeplane/plane-ee/monitor/lib/healthcheck"
	"github.com/makeplane/plane-ee/monitor/lib/logger"
	"github.com/makeplane/plane-ee/monitor/pkg/constants/descriptors"
	error_msgs "github.com/makeplane/plane-ee/monitor/pkg/constants/errors"
	"github.com/makeplane/plane-ee/monitor/pkg/types"
)

type HealthCheckRunner interface {
	GetLogger() *logger.Handler
	GetCredentials() types.Credentials
}

func RunHealthCheck(h HealthCheckRunner, statuses []*healthcheck.HealthCheckStatus, errors []*error) {
	if len(errors) != 0 {
		h.GetLogger().Error(context.Background(), fmt.Sprintf(descriptors.F_RECIEVED_ERROR, errors[0]))
		return
	}
	statusMap := map[string]string{}
	metaMap := map[string]prime_api.StatusMeta{}
	msg := ""

	for _, status := range statuses {
		normServiceName := "service_" + strings.ToLower(status.ServiceName)
		// If the service status is inside the ok status range
		if status.StatusCode >= 200 && status.StatusCode <= 227 {
			statusMap[normServiceName] = descriptors.HEALTHY
			msg = fmt.Sprintf(descriptors.F_HEALTHY_STATUS_MSG, status.ServiceName, status.StatusCode)
			h.GetLogger().Info(context.Background(), msg)
		} else {
			statusMap[normServiceName] = descriptors.UNHEALTHY

			var code = prime_api.NotReachable
			var statusCode = status.StatusCode
			reachable := 1

			if status.Status == healthcheck.SERVICE_STATUS_REACHABLE {
				code = prime_api.ReachableWithNotOkStatus
				msg = fmt.Sprintf(descriptors.F_UNHEALTHY_STATUS_MSG, status.StatusCode, status.ServiceName)
				h.GetLogger().Error(context.Background(), msg)
			} else {
				code = prime_api.NotReachable
				reachable = 0
				msg = fmt.Sprintf(descriptors.F_UNREACHABLE_STATUS_MSG, status.StatusCode, status.ServiceName)
				h.GetLogger().Error(context.Background(), msg)
			}
			metaMap[normServiceName] = prime_api.StatusMeta{
				Message:    msg,
				Code:       code,
				StatusCode: statusCode,
				Reachable:  reachable,
			}
		}
	}

	credentials := h.GetCredentials()
	monitorApi := prime_api.NewMonitorApi(credentials.Host, credentials.MachineSignature, credentials.InstanceId, credentials.AppVersion)
	errorCode := monitorApi.PostServiceStatus(prime_api.StatusPayload{
		Status:  statusMap,
		Meta:    metaMap,
		Version: h.GetCredentials().AppVersion,
	})

	if errorCode != 0 {
		h.GetLogger().Error(context.Background(), fmt.Sprintf(error_msgs.F_ERROR_REPORTING_STATUS, errorCode))
	}
}
