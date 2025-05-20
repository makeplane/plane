package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestGetDnsRecord(t *testing.T) {
	tests := []struct {
		Name        string
		Host        string
		RecordType  string
		ExpectError bool
	}{
		{
			Name:        "With the google domain",
			Host:        "google.com",
			RecordType:  "A",
			ExpectError: false,
		},
		{
			Name:        "With the google domain",
			Host:        "google.com",
			RecordType:  "MX",
			ExpectError: false,
		},
		{
			Name:        "With a subdomain host",
			Host:        "docs.google.com",
			RecordType:  "CNAME",
			ExpectError: true,
		},
		{
			Name:        "With an invalid record type",
			Host:        "google.com",
			RecordType:  "UBRINB",
			ExpectError: true,
		},
		{
			Name:        "With an invalid host name",
			Host:        "boogle",
			RecordType:  "TXT",
			ExpectError: true,
		},
		{
			Name:        "With a domain and port binding",
			Host:        "google:3000",
			RecordType:  "A",
			ExpectError: true,
		},
	}

	for _, tt := range tests {
		// Saving the tt variable to be captured by the function by reference
		tt := tt
		t.Run(
			tt.Name,
			func(t *testing.T) {
				t.Parallel()
				result, err := getDNSRecord(context.Background(), tt.Host, RecordType(tt.RecordType))
				if tt.ExpectError {
					assert.NotNil(t, err)
					assert.Empty(t, result)
				} else {
					assert.Nil(t, err)
					assert.NotEmpty(t, result)
				}
			},
		)
	}
}

func TestFindAllRecords(t *testing.T) {
	tests := []struct {
		Name        string
		Host        string
		Records     []string
		ExpectEmpty bool
		ExpectTypes []string
	}{
		{
			Name:        "With good host name",
			Host:        "google.com",
			Records:     []string{"A", "CNAME"},
			ExpectEmpty: false,
			// CNAME won't be found of the domain above
			ExpectTypes: []string{"A"},
		},
		{
			Name:        "With error host name",
			Host:        "error.com",
			Records:     []string{"A", "CNAME"},
			ExpectEmpty: true,
			ExpectTypes: nil,
		},
		{
			Name:        "With empty record types",
			Host:        "google.com",
			Records:     []string{},
			ExpectEmpty: false,
		},
		{
			Name:        "With non-existent record type",
			Host:        "google.com",
			Records:     []string{"NONEXISTENT"},
			ExpectEmpty: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			result := findAllRecords(tt.Host, tt.Records)
			for _, recordType := range tt.ExpectTypes {
				if tt.ExpectEmpty {
					assert.Empty(t, result.records)
				} else {
					if _, ok := result.records[recordType]; !ok {
						t.Errorf("Expected record type: %s not found", recordType)
					}
				}
			}
		})
	}
}

func TestDNSValidationHandler(t *testing.T) {
	app := fiber.New()

	app.Post("/validate", DNSValidationHandler)

	tests := []struct {
		Name           string
		RequestPayload ValidationRequestPayload
		ExpectedStatus int
		ExpectedBody   DNSValidationResult
	}{
		{
			Name: "Valid request",
			RequestPayload: ValidationRequestPayload{
				Host:        "google.com",
				RecordTypes: []string{"A", "CNAME"},
			},
			ExpectedStatus: fiber.StatusOK,
			ExpectedBody: DNSValidationResult{
				Error: "",
				Results: []FilterRecord{
					{
						Host: "google.com",
					},
				},
			},
		},
		{
			Name:           "Missing host",
			RequestPayload: ValidationRequestPayload{},
			ExpectedStatus: fiber.StatusBadRequest,
			ExpectedBody: DNSValidationResult{
				Error:   fmt.Sprintf(F_EITHER_ONE_VALUE_NOT_FOUND, "host", "types"),
				Results: []FilterRecord{},
			},
		},
		{
			Name: "Missing host",
			RequestPayload: ValidationRequestPayload{
				Host:        "",
				RecordTypes: []string{"A", "CNAME"},
			},
			ExpectedStatus: fiber.StatusBadRequest,
			ExpectedBody: DNSValidationResult{
				Error:   fmt.Sprintf(F_EITHER_ONE_VALUE_NOT_FOUND, "host", "types"),
				Results: []FilterRecord{},
			},
		},
		{
			Name: "Missing record types",
			RequestPayload: ValidationRequestPayload{
				Host:        "",
				RecordTypes: []string{"A", "CNAME"},
			},
			ExpectedStatus: fiber.StatusBadRequest,
			ExpectedBody: DNSValidationResult{
				Error:   fmt.Sprintf(F_EITHER_ONE_VALUE_NOT_FOUND, "host", "types"),
				Results: []FilterRecord{},
			},
		},
		{
			Name: "No records found",
			RequestPayload: ValidationRequestPayload{
				Host:        "bvonklsksfnbklfsnb.com",
				RecordTypes: []string{"A", "CNAME"},
			},
			ExpectedStatus: fiber.StatusPreconditionFailed,
			ExpectedBody: DNSValidationResult{
				Error:   fmt.Sprintf(F_EXPECTED_DNS_RECORD_NONE_FOUND, "bvonklsksfnbklfsnb.com"),
				Results: []FilterRecord{},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.Name, func(t *testing.T) {
			payload, _ := json.Marshal(tt.RequestPayload)
			req := httptest.NewRequest(fiber.MethodPost, "/validate", bytes.NewBuffer(payload))
			req.Header.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)

			resp, _ := app.Test(req, 2000)
			body := getStringBody(resp.Body)
			actualBody := DNSValidationResult{}
			json.Unmarshal([]byte(body), &actualBody)
			if tt.ExpectedBody.Error != "" {
				assert.Equal(t, tt.ExpectedBody.Error, actualBody.Error)
			} else {
				assert.NotZero(t, len(tt.ExpectedBody.Results))
			}
		})
	}
}

func getStringBody(body io.ReadCloser) string {
	defer body.Close()

	var sb strings.Builder
	_, err := io.Copy(&sb, body)
	if err != nil {
		return ""
	}

	return sb.String()
}
