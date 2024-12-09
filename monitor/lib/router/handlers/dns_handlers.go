package handlers

import (
	"context"
	"fmt"
	"net"
	"sync"

	"github.com/gofiber/fiber/v2"
)

const (
	HOST         = "host"
	RECORD_TYPES = "types"
)

// Creating a separate type for the record type
type RecordType string

type FilterRecord struct {
	Host   string `json:"host"`
	Type   string `json:"type"`
	Record string `json:"value"`
}

const (
	A_RECORD     RecordType = "A"
	CNAME_RECORD RecordType = "CNAME"
	TXT_RECORD   RecordType = "TXT"
	MX_RECORD    RecordType = "MX"
	SPF_RECORD   RecordType = "SPF"
)

type ValidationRequestPayload struct {
	Host        string   `json:"host"`
	RecordTypes []string `json:"types"`
}

type DNSValidationResult struct {
	Error   string         `json:"error"`
	Results []FilterRecord `json:"results"`
}

func DNSValidationHandler(ctx *fiber.Ctx) error {
	var payload ValidationRequestPayload

	if err := ctx.BodyParser(&payload); err != nil {
		resp := DNSValidationResult{
			Error:   err.Error(),
			Results: []FilterRecord{},
		}

		ctx.Status(fiber.StatusBadRequest).JSON(resp)
		return nil
	}

	// ensure if both the values are provided or not
	if payload.Host == "" || len(payload.RecordTypes) == 0 {
		resp := DNSValidationResult{
			Error:   fmt.Sprintf(F_EITHER_ONE_VALUE_NOT_FOUND, HOST, RECORD_TYPES),
			Results: []FilterRecord{},
		}
		ctx.Status(fiber.StatusBadRequest).JSON(resp)
		return nil
	}

	// Remove any repeated strings from the Record Types
	payload.RecordTypes = removeRepeatedStrings(payload.RecordTypes)

	// Lookup for the DNS Records with the Helper Function
	records := findAllRecords(payload.Host, payload.RecordTypes)

	if records == nil || len(records.records) == 0 {
		resp := DNSValidationResult{
			Error:   fmt.Sprintf(F_EXPECTED_DNS_RECORD_NONE_FOUND, payload.Host),
			Results: []FilterRecord{},
		}
		ctx.Status(fiber.StatusPreconditionFailed).JSON(resp)
		return nil
	}

	filteredRecords := make([]FilterRecord, 0)

	for recordType, records := range records.records {
		for _, rcrd := range records {
			filteredRecords = append(filteredRecords, FilterRecord{
				Host:   payload.Host,
				Type:   recordType,
				Record: rcrd,
			})
		}
	}

	ctx.Status(fiber.StatusOK).JSON(DNSValidationResult{
		Error:   "",
		Results: filteredRecords,
	})

	return nil
}

// CRecords Map is a struct wrapped around map, that facilitates concurrent
// access to a map DS
type CRecordsMap struct {
	records map[string][]string
}

type TypeRecords struct {
	RecordType string
	Records    []string
}

func findAllRecords(host string, recordTypes []string) *CRecordsMap {

	if len(recordTypes) == 0 {
		return nil
	}

	recordsChannel := make(chan TypeRecords)
	ctx, cancel := context.WithCancel(context.Background())
	rcds := make(map[string][]string)
	recordsMap := CRecordsMap{
		records: rcds,
	}

	var wg sync.WaitGroup

	for _, recordType := range recordTypes {
		wg.Add(1)
		go func(rtype string) {
			defer wg.Done()
			records, err := getDNSRecord(ctx, host, RecordType(rtype))
			if err != nil {
				cancel()
			} else {
				recordsChannel <- TypeRecords{
					RecordType: rtype,
					Records:    records,
				}
			}
		}(recordType)
	}

	go func() {
		wg.Wait()
		close(recordsChannel)
	}()

	for {
		records, ok := <-recordsChannel
		if !ok {
			recordsChannel = nil
		} else {
			rcds[records.RecordType] = records.Records
		}

		if recordsChannel == nil {
			break
		}
	}

	cancel()

	return &recordsMap
}

func getDNSRecord(ctx context.Context, host string, recordType RecordType) ([]string, error) {
	select {
	case <-ctx.Done():
		return []string{}, nil
	default:
		switch recordType {
		case A_RECORD:
			return net.LookupHost(host)
		case CNAME_RECORD:
			cnameRecord, err := net.LookupCNAME(host)
			// Special case where the cname record consist of hostname with a dot
			// appended, but actually the domain doesn't exist
			if cnameRecord == host+"." {
				return []string{}, fmt.Errorf(F_EXPECTED_DNS_RECORD_NONE_FOUND, host)
			}
			return []string{cnameRecord}, err
		case TXT_RECORD:
			return net.LookupTXT(host)
		case MX_RECORD:
			mxRecords, err := net.LookupMX(host)
			if err != nil {
				return nil, err
			} else {
				mxStrings := make([]string, len(mxRecords))
				for i, mx := range mxRecords {
					mxStrings[i] = fmt.Sprintf("%s %d", mx.Host, mx.Pref)
				}
				return mxStrings, nil
			}
		default:
			return []string{}, fmt.Errorf(INVALID_RECORD_TYPE_PROVIDED)
		}
	}
}

// ------------------------ Helpers --------------------------------
func removeRepeatedStrings(input []string) []string {
	// Map to keep track of the count of each string
	countMap := make(map[string]bool)
	for _, str := range input {
		countMap[str] = true
	}

	// Extracting the keys from the map
	keys := make([]string, 0)
	for key := range countMap {
		keys = append(keys, key)
	}
	return keys
}
