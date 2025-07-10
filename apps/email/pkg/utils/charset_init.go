package utils

import (
	"github.com/emersion/go-message/charset"
	"golang.org/x/text/encoding"
	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/encoding/japanese"
	"golang.org/x/text/encoding/korean"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/encoding/traditionalchinese"
	"golang.org/x/text/encoding/unicode"
)

// init runs automatically on program start.
func init() {
	// Map of charset labels to the corresponding encoding implementation.
	// Add or remove entries here if you extend charset support in utils/charset.go.
	var charsets = map[string]encoding.Encoding{
		// Western European
		"windows-1252": charmap.Windows1252,
		"windows1252":  charmap.Windows1252,
		"cp1252":       charmap.Windows1252,
		"iso-8859-1":   charmap.ISO8859_1,
		"iso-8859-15":  charmap.ISO8859_15,

		// Central European & Cyrillic
		"windows-1250": charmap.Windows1250,
		"windows-1251": charmap.Windows1251,
		"iso-8859-2":   charmap.ISO8859_2,
		"iso-8859-5":   charmap.ISO8859_5,
		"koi8-r":       charmap.KOI8R,
		"koi8-u":       charmap.KOI8U,

		// Japanese
		"shift_jis":   japanese.ShiftJIS,
		"iso-2022-jp": japanese.ISO2022JP,
		"euc-jp":      japanese.EUCJP,

		// Korean
		"euc-kr": korean.EUCKR,

		// Chinese
		"gb2312":  simplifiedchinese.GB18030,
		"gbk":     simplifiedchinese.GBK,
		"gb18030": simplifiedchinese.GB18030,
		"big5":    traditionalchinese.Big5,

		// Unicode varieties (for completeness)
		"utf-16":   unicode.UTF16(unicode.LittleEndian, unicode.UseBOM),
		"utf-16be": unicode.UTF16(unicode.BigEndian, unicode.IgnoreBOM),
		"utf-16le": unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM),
	}

	// Register every mapping with go-message so header decoding works.
	for label, enc := range charsets {
		charset.RegisterEncoding(label, enc)
	}
}
