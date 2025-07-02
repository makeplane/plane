package logger

import (
	"os"

	"github.com/sirupsen/logrus"
)

type Logger struct {
	*logrus.Logger
}

var Log = New() // Expose the logger instance

func New() *Logger {
	base := logrus.New()

	base.SetFormatter(&logrus.JSONFormatter{
		PrettyPrint:     false,
		TimestampFormat: "2006-01-02T15:04:05Z07:00",
	})

	base.SetOutput(os.Stdout)
	base.SetLevel(logrus.InfoLevel)

	return &Logger{base}
}
