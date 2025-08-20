// Package utils provides utility functions for email processing, including advanced charset detection
// and conversion capabilities for handling emails from various international sources.
//
// The charset detection system supports:
//   - Byte Order Mark (BOM) detection for UTF-8, UTF-16 variants
//   - Header-based charset detection from Content-Type and other email headers
//   - Heuristic analysis for common charsets when explicit declaration is missing
//   - Conversion from 20+ different character encodings to UTF-8
//
// Example usage:
//
//	// Read email data from file or network
//	emailData, err := os.ReadFile("email.eml")
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Create charset-aware reader
//	reader, err := CreateCharsetAwareReader(emailData)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Use reader to parse email
//	header, err := reader.NextPart()
//	if err != nil {
//		log.Fatal(err)
//	}
package utils

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"unicode/utf8"

	"plane/email/pkg/logger"

	"github.com/emersion/go-message/mail"
	"github.com/sirupsen/logrus"
	"golang.org/x/text/encoding"
	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/encoding/japanese"
	"golang.org/x/text/encoding/korean"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/encoding/traditionalchinese"
	"golang.org/x/text/encoding/unicode"
	"golang.org/x/text/transform"
)

// charsetDetector provides comprehensive charset detection and conversion capabilities.
// It maintains a registry of supported character encodings and provides methods for
// detecting charset through multiple strategies: BOM analysis, header parsing, and
// heuristic content analysis.
//
// The detector supports the following charset categories:
//   - Western European: Windows-1252, ISO-8859-1, ISO-8859-15
//   - Central European: Windows-1250, ISO-8859-2
//   - Cyrillic: Windows-1251, ISO-8859-5, KOI8-R, KOI8-U
//   - East Asian: Shift_JIS, ISO-2022-JP, EUC-JP, EUC-KR, GB2312, GBK, GB18030, Big5
//   - Unicode: UTF-8, UTF-16 (BE/LE with and without BOM)
type charsetDetector struct {
	// patterns maps charset names to their corresponding encoding implementations
	patterns map[string]encoding.Encoding
	// regex is a compiled regular expression for detecting charset declarations in headers
	regex *regexp.Regexp
}

// newCharsetDetector creates and initializes a new charset detector with support for
// commonly used character encodings in email systems.
//
// The detector is initialized with patterns for:
//   - Windows code pages (1250, 1251, 1252)
//   - ISO-8859 variants (1, 2, 5, 15)
//   - KOI8 variants (R, U)
//   - Japanese encodings (Shift_JIS, ISO-2022-JP, EUC-JP)
//   - Korean encodings (EUC-KR)
//   - Chinese encodings (GB2312, GBK, GB18030, Big5)
//   - Unicode variants (UTF-8, UTF-16 BE/LE)
//
// Example usage:
//
//	detector := newCharsetDetector()
//	charset := detector.detectCharset(emailData)
//	fmt.Printf("Detected charset: %s\n", charset)
func newCharsetDetector() *charsetDetector {
	// Initialize mapping of charset names to encoding implementations
	patterns := map[string]encoding.Encoding{
		// Western European charsets
		"windows-1252": charmap.Windows1252, // Common in Western emails
		"iso-8859-1":   charmap.ISO8859_1,   // Latin-1, widely used fallback
		"iso-8859-15":  charmap.ISO8859_15,  // Latin-9, includes Euro symbol

		// Central European charsets
		"windows-1250": charmap.Windows1250, // Central European Windows
		"iso-8859-2":   charmap.ISO8859_2,   // Latin-2, Central European

		// Cyrillic charsets
		"windows-1251": charmap.Windows1251, // Cyrillic Windows
		"iso-8859-5":   charmap.ISO8859_5,   // Cyrillic ISO
		"koi8-r":       charmap.KOI8R,       // Russian KOI8
		"koi8-u":       charmap.KOI8U,       // Ukrainian KOI8

		// Japanese charsets
		"shift_jis":   japanese.ShiftJIS,  // Shift JIS, common in Japanese emails
		"iso-2022-jp": japanese.ISO2022JP, // ISO-2022-JP, Japanese standard
		"euc-jp":      japanese.EUCJP,     // EUC-JP, Extended Unix Code

		// Korean charsets
		"euc-kr": korean.EUCKR, // EUC-KR, Korean standard

		// Chinese charsets
		"gb2312":  simplifiedchinese.GB18030, // Simplified Chinese
		"gbk":     simplifiedchinese.GBK,     // GBK, Chinese extension
		"gb18030": simplifiedchinese.GB18030, // GB18030, Chinese national standard
		"big5":    traditionalchinese.Big5,   // Big5, Traditional Chinese

		// Unicode charsets
		"utf-16":   unicode.UTF16(unicode.LittleEndian, unicode.UseBOM),    // UTF-16 with BOM
		"utf-16be": unicode.UTF16(unicode.BigEndian, unicode.IgnoreBOM),    // UTF-16 Big Endian
		"utf-16le": unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM), // UTF-16 Little Endian
	}

	// Create regex pattern to match charset declarations in email headers
	// Matches patterns like: charset=utf-8, charset="windows-1252", charset='iso-8859-1'
	charsetPattern := `charset\s*=\s*["']?([^"'\s;]+)["']?`
	regex := regexp.MustCompile(`(?i)` + charsetPattern)

	return &charsetDetector{
		patterns: patterns,
		regex:    regex,
	}
}

// detectCharsetFromHeaders attempts to detect charset from email headers by parsing
// Content-Type and other relevant headers for charset declarations.
//
// This method searches for charset declarations in the following order:
//  1. Content-Type header (most reliable)
//  2. Other headers containing charset information
//
// Parameters:
//   - data: Raw email data containing headers
//
// Returns:
//   - string: Detected charset name in lowercase, or empty string if not found
//
// Example header patterns detected:
//   - "Content-Type: text/plain; charset=utf-8"
//   - "Content-Type: text/html; charset=\"windows-1252\""
//   - "Content-Transfer-Encoding: quoted-printable; charset=iso-8859-1"
func (cd *charsetDetector) detectCharsetFromHeaders(data []byte) string {
	logger.Log.WithFields(logrus.Fields{
		"method":    "detectCharsetFromHeaders",
		"data_size": len(data),
	}).Debug("Starting charset detection from headers")

	// Look for charset in Content-Type header (most common and reliable)
	// Pattern matches: Content-Type: text/plain; charset=utf-8
	contentTypePattern := regexp.MustCompile(`(?i)content-type:.*charset\s*=\s*["']?([^"'\s;]+)["']?`)
	if matches := contentTypePattern.FindSubmatch(data); len(matches) > 1 {
		charset := strings.ToLower(string(matches[1]))
		logger.Log.WithFields(logrus.Fields{
			"method":  "detectCharsetFromHeaders",
			"source":  "content-type",
			"charset": charset,
		}).Info("Charset detected from Content-Type header")
		return charset
	}

	// Look for charset in other headers as fallback
	// This catches charset declarations in less common header locations
	if matches := cd.regex.FindSubmatch(data); len(matches) > 1 {
		charset := strings.ToLower(string(matches[1]))
		logger.Log.WithFields(logrus.Fields{
			"method":  "detectCharsetFromHeaders",
			"source":  "other_headers",
			"charset": charset,
		}).Info("Charset detected from other headers")
		return charset
	}

	logger.Log.WithFields(logrus.Fields{
		"method": "detectCharsetFromHeaders",
	}).Debug("No charset detected from headers")
	return ""
}

// detectCharsetFromBOM detects charset from Byte Order Mark (BOM) at the beginning
// of the data. BOM is a special marker that indicates the encoding and byte order
// of Unicode text.
//
// Supported BOM patterns:
//   - UTF-8: EF BB BF
//   - UTF-16 Little Endian: FF FE
//   - UTF-16 Big Endian: FE FF
//
// Parameters:
//   - data: Raw email data to analyze for BOM
//
// Returns:
//   - string: Detected charset name, or empty string if no BOM found
//
// Example:
//
//	data := []byte{0xEF, 0xBB, 0xBF, 'H', 'e', 'l', 'l', 'o'}
//	charset := detector.detectCharsetFromBOM(data)
//	// Returns: "utf-8"
func (cd *charsetDetector) detectCharsetFromBOM(data []byte) string {
	if len(data) < 2 {
		logger.Log.WithFields(logrus.Fields{
			"method":    "detectCharsetFromBOM",
			"data_size": len(data),
		}).Debug("Data too small for BOM detection")
		return ""
	}

	logger.Log.WithFields(logrus.Fields{
		"method":    "detectCharsetFromBOM",
		"data_size": len(data),
	}).Debug("Starting BOM detection")

	// UTF-16 BOM detection (requires at least 2 bytes)
	if len(data) >= 2 {
		// UTF-16 Little Endian BOM: FF FE
		if data[0] == 0xFF && data[1] == 0xFE {
			logger.Log.WithFields(logrus.Fields{
				"method":    "detectCharsetFromBOM",
				"charset":   "utf-16le",
				"bom_bytes": "FF FE",
			}).Info("UTF-16 Little Endian BOM detected")
			return "utf-16le"
		}
		// UTF-16 Big Endian BOM: FE FF
		if data[0] == 0xFE && data[1] == 0xFF {
			logger.Log.WithFields(logrus.Fields{
				"method":    "detectCharsetFromBOM",
				"charset":   "utf-16be",
				"bom_bytes": "FE FF",
			}).Info("UTF-16 Big Endian BOM detected")
			return "utf-16be"
		}
	}

	// UTF-8 BOM detection (requires at least 3 bytes): EF BB BF
	if len(data) >= 3 && data[0] == 0xEF && data[1] == 0xBB && data[2] == 0xBF {
		logger.Log.WithFields(logrus.Fields{
			"method":    "detectCharsetFromBOM",
			"charset":   "utf-8",
			"bom_bytes": "EF BB BF",
		}).Info("UTF-8 BOM detected")
		return "utf-8"
	}

	logger.Log.WithFields(logrus.Fields{
		"method": "detectCharsetFromBOM",
	}).Debug("No BOM detected")
	return ""
}

// isValidUTF8 checks if the provided data contains valid UTF-8 encoded text.
// This is used as part of the heuristic charset detection process.
//
// Parameters:
//   - data: Byte slice to validate
//
// Returns:
//   - bool: true if data is valid UTF-8, false otherwise
//
// Example:
//
//	validUTF8 := []byte("Hello, 世界!")
//	isValid := detector.isValidUTF8(validUTF8) // Returns: true
//
//	invalidUTF8 := []byte{0xFF, 0xFE, 0xFD}
//	isValid = detector.isValidUTF8(invalidUTF8) // Returns: false
func (cd *charsetDetector) isValidUTF8(data []byte) bool {
	isValid := utf8.Valid(data)
	logger.Log.WithFields(logrus.Fields{
		"method":    "isValidUTF8",
		"data_size": len(data),
		"is_valid":  isValid,
	}).Debug("UTF-8 validation result")
	return isValid
}

// detectCharsetHeuristic uses heuristic analysis to detect charset when explicit
// declarations are not available. This method analyzes byte patterns and character
// distributions to make educated guesses about the charset.
//
// Heuristic strategy:
//  1. Check for Windows-1252 specific characters (0x80-0x9F range)
//  2. Validate UTF-8 encoding
//  3. Fall back to ISO-8859-1 for non-UTF-8 data
//  4. Default to UTF-8 for valid UTF-8 data
//
// Parameters:
//   - data: Raw email data to analyze
//
// Returns:
//   - string: Best guess charset name based on heuristic analysis
//
// Example:
//
//	// Data with Windows-1252 characters
//	data := []byte{0x93, 0x94, 0x85} // Left/right quotes and ellipsis
//	charset := detector.detectCharsetHeuristic(data)
//	// Returns: "windows-1252"
func (cd *charsetDetector) detectCharsetHeuristic(data []byte) string {
	logger.Log.WithFields(logrus.Fields{
		"method":    "detectCharsetHeuristic",
		"data_size": len(data),
	}).Debug("Starting heuristic charset detection")

	// Analyze data for Windows-1252 specific characters
	// Windows-1252 uses the 0x80-0x9F range for printable characters
	// (unlike ISO-8859-1 which treats this range as control characters)
	hasWindows1252Chars := false
	windows1252Count := 0
	for _, b := range data {
		if b >= 0x80 && b <= 0x9F {
			hasWindows1252Chars = true
			windows1252Count++
		}
	}

	logger.Log.WithFields(logrus.Fields{
		"method":                 "detectCharsetHeuristic",
		"has_windows1252_chars":  hasWindows1252Chars,
		"windows1252_char_count": windows1252Count,
	}).Debug("Windows-1252 character analysis")

	// If we found Windows-1252 characters and the data is not valid UTF-8,
	// it's likely Windows-1252 encoded
	if hasWindows1252Chars && !cd.isValidUTF8(data) {
		logger.Log.WithFields(logrus.Fields{
			"method":  "detectCharsetHeuristic",
			"charset": "windows-1252",
			"reason":  "contains_windows1252_chars_and_not_utf8",
		}).Info("Charset detected using heuristics")
		return "windows-1252"
	}

	// If data is not valid UTF-8 and doesn't have Windows-1252 characteristics,
	// fall back to ISO-8859-1 (Latin-1) which can represent any byte sequence
	if !cd.isValidUTF8(data) {
		logger.Log.WithFields(logrus.Fields{
			"method":  "detectCharsetHeuristic",
			"charset": "iso-8859-1",
			"reason":  "not_valid_utf8_fallback",
		}).Info("Charset detected using heuristics")
		return "iso-8859-1"
	}

	// Data appears to be valid UTF-8
	logger.Log.WithFields(logrus.Fields{
		"method":  "detectCharsetHeuristic",
		"charset": "utf-8",
		"reason":  "valid_utf8",
	}).Info("Charset detected using heuristics")
	return "utf-8"
}

// detectCharset orchestrates the complete charset detection process using multiple
// strategies in order of reliability. This is the main entry point for charset
// detection.
//
// Detection strategy (in order of preference):
//  1. BOM detection (most reliable)
//  2. Header analysis (declared charset)
//  3. Heuristic analysis (educated guess)
//
// Parameters:
//   - data: Raw email data to analyze
//
// Returns:
//   - string: Detected charset name
//
// Example:
//
//	detector := newCharsetDetector()
//
//	// Email with UTF-8 BOM
//	utf8Data := []byte{0xEF, 0xBB, 0xBF, 'H', 'e', 'l', 'l', 'o'}
//	charset := detector.detectCharset(utf8Data)
//	// Returns: "utf-8"
//
//	// Email with charset header
//	headerData := []byte("Content-Type: text/plain; charset=windows-1252\r\n\r\nHello")
//	charset = detector.detectCharset(headerData)
//	// Returns: "windows-1252"
func (cd *charsetDetector) detectCharset(data []byte) string {
	logger.Log.WithFields(logrus.Fields{
		"method":    "detectCharset",
		"data_size": len(data),
	}).Info("Starting charset detection")

	// Strategy 1: Check for Byte Order Mark (most reliable)
	if charset := cd.detectCharsetFromBOM(data); charset != "" {
		logger.Log.WithFields(logrus.Fields{
			"method":           "detectCharset",
			"charset":          charset,
			"detection_method": "BOM",
		}).Info("Charset detected successfully")
		return charset
	}

	// Strategy 2: Parse email headers for charset declarations
	if charset := cd.detectCharsetFromHeaders(data); charset != "" {
		logger.Log.WithFields(logrus.Fields{
			"method":           "detectCharset",
			"charset":          charset,
			"detection_method": "headers",
		}).Info("Charset detected successfully")
		return charset
	}

	// Strategy 3: Use heuristic analysis as last resort
	charset := cd.detectCharsetHeuristic(data)
	logger.Log.WithFields(logrus.Fields{
		"method":           "detectCharset",
		"charset":          charset,
		"detection_method": "heuristics",
	}).Info("Charset detected successfully")
	return charset
}

// convertToUTF8 converts data from the specified charset to UTF-8 encoding.
// This ensures that all processed email data is in a consistent UTF-8 format
// regardless of the original encoding.
//
// Parameters:
//   - data: Raw data in the source charset
//   - charset: Source charset name (case-insensitive)
//
// Returns:
//   - []byte: Data converted to UTF-8 encoding
//   - error: Conversion error if charset is unsupported or conversion fails
//
// Example:
//
//	// Convert Windows-1252 data to UTF-8
//	windows1252Data := []byte{0x93, 0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x94} // "Hello" with smart quotes
//	utf8Data, err := detector.convertToUTF8(windows1252Data, "windows-1252")
//	if err != nil {
//		log.Fatal(err)
//	}
//	fmt.Printf("UTF-8: %s\n", utf8Data) // Properly converted smart quotes
func (cd *charsetDetector) convertToUTF8(data []byte, charset string) ([]byte, error) {
	logger.Log.WithFields(logrus.Fields{
		"method":           "convertToUTF8",
		"original_charset": charset,
		"data_size":        len(data),
	}).Info("Starting charset conversion")

	charset = strings.ToLower(charset)

	// Quick return for UTF-8 data (no conversion needed)
	if charset == "utf-8" || charset == "utf8" {
		logger.Log.WithFields(logrus.Fields{
			"method":  "convertToUTF8",
			"charset": charset,
		}).Debug("Data already in UTF-8, no conversion needed")
		return data, nil
	}

	// Look up the encoding implementation for the detected charset
	encoder, exists := cd.patterns[charset]
	if !exists {
		logger.Log.WithFields(logrus.Fields{
			"method":             "convertToUTF8",
			"charset":            charset,
			"supported_charsets": getMapKeys(cd.patterns),
		}).Error("Unsupported charset")
		return nil, fmt.Errorf("unsupported charset: %s", charset)
	}

	// Perform the actual charset conversion using golang.org/x/text/transform
	decoder := encoder.NewDecoder()
	converted, _, err := transform.Bytes(decoder, data)
	if err != nil {
		logger.Log.WithFields(logrus.Fields{
			"method":  "convertToUTF8",
			"charset": charset,
			"error":   err.Error(),
		}).Error("Failed to convert charset")
		return nil, fmt.Errorf("failed to convert from %s to UTF-8: %v", charset, err)
	}

	logger.Log.WithFields(logrus.Fields{
		"method":           "convertToUTF8",
		"original_charset": charset,
		"original_size":    len(data),
		"converted_size":   len(converted),
	}).Info("Charset conversion completed successfully")

	return converted, nil
}

// getMapKeys returns the keys of a map for logging purposes.
// This helper function is used to log the list of supported charsets
// when an unsupported charset is encountered.
//
// Parameters:
//   - m: Map to extract keys from
//
// Returns:
//   - []string: Slice of map keys
func getMapKeys(m map[string]encoding.Encoding) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// CreateCharsetAwareReader creates a mail reader that can handle emails with various
// character encodings. This is the main public API for charset-aware email processing.
//
// The function automatically:
//  1. Detects the charset of the input data
//  2. Converts the data to UTF-8 if necessary
//  3. Creates a mail.Reader for further processing
//  4. Provides fallback handling for conversion failures
//
// Parameters:
//   - data: Raw email data (typically from file or network)
//
// Returns:
//   - *mail.Reader: Configured mail reader ready for parsing
//   - error: Error if neither conversion nor fallback parsing succeeds
//
// Example usage:
//
//	// Read email from file
//	emailData, err := os.ReadFile("international-email.eml")
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Create charset-aware reader
//	reader, err := CreateCharsetAwareReader(emailData)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Parse email header
//	header, err := reader.NextPart()
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Access email fields
//	from, _ := header.Header.AddressList("From")
//	subject := header.Header.Get("Subject")
//	fmt.Printf("From: %v\nSubject: %s\n", from, subject)
//
//	// Process email body
//	for {
//		part, err := reader.NextPart()
//		if err == io.EOF {
//			break
//		}
//		if err != nil {
//			log.Fatal(err)
//		}
//		// Process part...
//	}
func CreateCharsetAwareReader(data []byte) (*mail.Reader, error) {
	logger.Log.WithFields(logrus.Fields{
		"function":  "CreateCharsetAwareReader",
		"data_size": len(data),
	}).Info("Creating charset-aware mail reader")

	// Initialize the charset detector
	detector := newCharsetDetector()

	// Detect the charset of the input data
	charset := detector.detectCharset(data)

	// Convert to UTF-8 if needed
	convertedData, err := detector.convertToUTF8(data, charset)
	if err != nil {
		logger.Log.WithFields(logrus.Fields{
			"function": "CreateCharsetAwareReader",
			"charset":  charset,
			"error":    err.Error(),
		}).Warn("Charset conversion failed, attempting to parse original data")

		// Fallback: try to parse original data if conversion fails
		// This handles cases where charset detection was incorrect
		reader, parseErr := mail.CreateReader(bytes.NewReader(data))
		if parseErr != nil {
			logger.Log.WithFields(logrus.Fields{
				"function":       "CreateCharsetAwareReader",
				"original_error": err.Error(),
				"parse_error":    parseErr.Error(),
			}).Error("Failed to create mail reader with both converted and original data")
			return nil, parseErr
		}

		logger.Log.WithFields(logrus.Fields{
			"function": "CreateCharsetAwareReader",
		}).Info("Successfully created mail reader with original data")
		return reader, nil
	}

	// Create reader with converted UTF-8 data
	reader, err := mail.CreateReader(bytes.NewReader(convertedData))
	if err != nil {
		logger.Log.WithFields(logrus.Fields{
			"function": "CreateCharsetAwareReader",
			"charset":  charset,
			"error":    err.Error(),
		}).Error("Failed to create mail reader with converted data")
		return nil, err
	}

	logger.Log.WithFields(logrus.Fields{
		"function":       "CreateCharsetAwareReader",
		"charset":        charset,
		"original_size":  len(data),
		"converted_size": len(convertedData),
	}).Info("Successfully created charset-aware mail reader")

	return reader, nil
}
