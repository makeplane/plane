package services

import (
	"bytes"
	"errors"
	"io"
	"plane/email/pkg/logger"
	"plane/email/pkg/utils/parser"
	"strings"

	"github.com/emersion/go-message/mail"
	"github.com/emersion/go-smtp"
)

type Session struct {
	From string
	To   []string
}

func (s *Session) AuthPlain(username, password string) error {
	// log.Println("Authenticating user", username)

	if AuthenticateUser(username, password) {
		return nil
	}
	return errors.New("invalid username or password")
}

func (s *Session) Mail(from string, opts *smtp.MailOptions) error {
	s.From = from
	// log.Printf("Mail from: %s", from)
	return nil
}

func (s *Session) Rcpt(to string, opts *smtp.RcptOptions) error {
	// log.Printf("Rcpt to: %s", to)
	s.To = append(s.To, to)
	return nil
}

func (s *Session) Data(r io.Reader) error {
	// log.Println("Receiving message")
	if s.From == "" || len(s.To) == 0 {
		logger.Log.Errorf("missing from or to address")
		return errors.New("missing from or to address")
	}

	// Read email data
	var buf bytes.Buffer
	if _, err := io.Copy(&buf, r); err != nil {
		logger.Log.Errorf("failed to read email data: %v", err)
		return err
	}
	data := buf.Bytes()

	// Basic spam check
	if parser.IsBacklistedDomain(string(s.From)) {
		logger.Log.Errorf("Detected spam domain from %s", s.From)
		return errors.New("message rejected")
	}
	if parser.IsSpam(string(data)) {
		logger.Log.Errorf("Detected spam from %s", s.From)
		return errors.New("message rejected")
	}

	// Parse the email
	mr, err := mail.CreateReader(bytes.NewReader(data))
	if err != nil {
		logger.Log.Errorf("failed to parse email: %v", err)
		return err
	}

	header := mr.Header
	subject, _ := header.Subject()
	var attachments []Attachment // Custom struct to hold attachment metadata

	var plainBody, htmlBody string
	for {
		p, err := mr.NextPart()
		if err == io.EOF {
			break
		} else if err != nil {
			logger.Log.Errorf("failed to read email part: %v", err)
			return err
		}

		switch h := p.Header.(type) {
		case *mail.InlineHeader:
			// Check the content type of this part
			contentType, _, _ := h.ContentType()
			b, _ := io.ReadAll(p.Body)

			if contentType == "text/plain" {
				plainBody = string(b)
			} else if contentType == "text/html" {
				htmlBody = string(b)
			}
		case *mail.AttachmentHeader:
			filename, _ := h.Filename()
			contentType, _, _ := h.ContentType()
			content, err := io.ReadAll(p.Body)
			if err != nil {
				logger.Log.Errorf("failed to read attachment %s: %v", filename, err)
				continue
			}
			logger.Log.Infof("Received attachment: %s (%s)", filename, contentType)
			// Save or process the attachment
			attachments = append(attachments, Attachment{
				Name:    filename,
				Type:    contentType,
				Size:    len(content),
				Content: content,
			})

		}
	}

	// get attachment urls
	attachmentIDs, err := UploadAttachment(attachments, strings.Join(s.To, ", "), s.From)

	// update attachment IDs
	if err != nil {
		logger.Log.Errorf("failed to upload attachments: %v", err)
		return err
	}

	// Prefer HTML if available, otherwise use plain text
	body := plainBody
	if htmlBody != "" {
		body = htmlBody // Or consider storing both separately
	}

	// Store the email
	if err := SaveEmail(s.From, strings.Join(s.To, ", "), subject, body, attachmentIDs); err != nil {
		logger.Log.Errorf("failed to save email: %v", err)
		return err
	}

	logger.Log.Infof("Email processed successfully: %s", s.From)
	return nil
}

func (s *Session) Reset() {
	s.From = ""
	s.To = nil
}

func (s *Session) Logout() error {
	return nil
}
