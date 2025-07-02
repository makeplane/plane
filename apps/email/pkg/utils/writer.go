package utils

import "log"

type DebugWriter struct{}

func (w DebugWriter) Write(p []byte) (n int, err error) {
	log.Printf("DEBUG: %s", p)
	return len(p), nil
}
