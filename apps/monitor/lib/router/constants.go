package router

import "encoding/json"

// ------------------ Router Options -----------------------

var defaultRouterOptions = MonitorRouterOptions{
	AppName:           "Prime Monitor",
	PrintRoutes:       true,
	Encoder:           json.Marshal,
	Decoder:           json.Unmarshal,
	DisableKeepAlive:  true,
	ReduceMemoryUsage: false,
}
