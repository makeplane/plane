package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"plane/email/pkg/logger"
	"time"

	"github.com/sirupsen/logrus"
)

var EMAIL_SAVE_ENDPOINT string = os.Getenv("EMAIL_SAVE_ENDPOINT")

type EmailData struct {
	From        string   `json:"from"`
	To          string   `json:"to"`
	Subject     string   `json:"subject"`
	Body        string   `json:"body"`
	Attachments []string `json:"attachments"`
}

type Attachment struct {
	Name    string `json:"name"`
	Type    string `json:"type"`
	Size    int    `json:"size"`
	Content []byte `json:"content"`
}

type AttachmentURLData struct {
	Name string `json:"name"`
	Type string `json:"type"`
	Size int    `json:"size"`
}

type AttachmentPostData struct {
	To   string `json:"to"`
	Name string `json:"name"`
	Type string `json:"type"`
	Size int    `json:"size"`
}

type PreSignedURL struct {
	URL    string            `json:"url"`
	Fields map[string]string `json:"fields"`
}

type AttachmentURLResponse struct {
	AssetId      string       `json:"asset_id"`
	PreSignedURL PreSignedURL `json:"presigned_url"`
}

func SaveEmail(from, to, subject, body string, attachmentIDs []string) error {
	// Do the API call to POST the email content
	if EMAIL_SAVE_ENDPOINT == "" {
		filename := fmt.Sprintf("emails/%d.eml", time.Now().UnixNano())
		content := fmt.Sprintf("From: %s\nTo: %s\nSubject: %s\n\n%s", from, to, subject, body)
		return os.WriteFile(filename, []byte(content), 0644)
	} else {
		response, err := post(EMAIL_SAVE_ENDPOINT, EmailData{
			From:        from,
			To:          to,
			Subject:     subject,
			Body:        body,
			Attachments: attachmentIDs,
		})
		if err != nil {
			logger.Log.WithFields(logrus.Fields{
				"to":   to,
				"from": from,
			}).Errorf("failed to save email: %v", err)
			return fmt.Errorf("error saving email: %v", err)
		}
		logger.Log.WithFields(logrus.Fields{
			"to":   to,
			"from": from,
		}).Info(string(response))
	}
	return nil
}

func UploadAttachment(attachmentData []Attachment, to string, from string) ([]string, error) {
	var uploadedAttachmentID []string
	if EMAIL_SAVE_ENDPOINT == "" {
		logger.Log.WithFields(logrus.Fields{
			"to":   to,
			"from": from,
		}).Error("EMAIL_SAVE_ENDPOINT is not set")
		return nil, errors.New("EMAIL_SAVE_ENDPOINT is not set")
	} else {
		// Loop through each attachment
		for _, attachment := range attachmentData {

			// Create a new HTTP request for the S3 upload url
			response, err := post(EMAIL_SAVE_ENDPOINT+"attachments/", AttachmentPostData{
				To:   to,
				Name: attachment.Name,
				Type: attachment.Type,
				Size: attachment.Size,
			})
			if err != nil {
				logger.Log.WithFields(logrus.Fields{
					"to":   to,
					"from": from,
				}).Errorf("error getting attachment pre-signed URL: %v", err)
				return nil, err
			}

			// Create a new HTTP request for the S3 upload
			var result AttachmentURLResponse
			if err := json.Unmarshal(response, &result); err != nil {
				logger.Log.WithFields(logrus.Fields{
					"to":   to,
					"from": from,
				}).Errorf("error unmarshalling response: %v", err)
				return nil, err
			}

			var buf bytes.Buffer
			writer := multipart.NewWriter(&buf)
			// Add all fields from the presigned URL
			for key, value := range result.PreSignedURL.Fields {
				if err := writer.WriteField(key, value); err != nil {
					logger.Log.WithFields(logrus.Fields{
						"to":   to,
						"from": from,
					}).Errorf("error writing field %s: %v", key, err)
					return nil, fmt.Errorf("error writing field %s: %v", key, err)
				}
			}
			// Add the file content as a form file
			fileWriter, err := writer.CreateFormFile("file", attachment.Name)
			if err != nil {
				logger.Log.WithFields(logrus.Fields{
					"to":   to,
					"from": from,
				}).Errorf("error creating form file: %v", err)
				return nil, fmt.Errorf("error creating form file: %v", err)
			}
			if _, err := io.Copy(fileWriter, bytes.NewReader(attachment.Content)); err != nil {
				logger.Log.WithFields(logrus.Fields{
					"to":   to,
					"from": from,
				}).Errorf("error copying file content: %v", err)
				return nil, fmt.Errorf("error copying file content: %v", err)
			}

			// Close the writer to finalize the body
			writer.Close()

			// Create the request
			req, err := http.NewRequest("POST", result.PreSignedURL.URL, &buf)
			if err != nil {
				logger.Log.WithFields(logrus.Fields{
					"to":   to,
					"from": from,
				}).Errorf("error creating POST request: %v", err)
				return nil, fmt.Errorf("error creating POST request: %v", err)
			}
			req.Header.Set("Content-Type", writer.FormDataContentType())

			// Send the request
			client := &http.Client{}
			resp, err := client.Do(req)
			if err != nil {
				logger.Log.WithFields(logrus.Fields{
					"to":   to,
					"from": from,
				}).Errorf("error uploading to S3: %v", err)
				return nil, fmt.Errorf("error uploading to S3: %v", err)
			}
			defer resp.Body.Close()

			// Check the response status
			if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
				body, _ := io.ReadAll(resp.Body)
				return nil, fmt.Errorf("error uploading to S3: status %d, response: %s", resp.StatusCode, string(body))
			}
			logger.Log.WithFields(logrus.Fields{
				"to":   to,
				"from": from,
			}).Infof("successfully uploaded to S3 %s", result.AssetId)
			uploadedAttachmentID = append(uploadedAttachmentID, result.AssetId)
		}
	}

	return uploadedAttachmentID, nil
}

func post(url string, data any) ([]byte, error) {
	// Marshal the data into JSON
	jsonData, err := json.Marshal(data)
	if err != nil {
		logger.Log.Errorf("error marshalling data: %v", err)
		return nil, fmt.Errorf("error marshalling data: %v", err)
	}

	// Create a new POST request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		logger.Log.Errorf("error creating request: %v", err)
		return nil, fmt.Errorf("error creating request: %v", err)
	}

	// Set the appropriate headers
	req.Header.Set("Content-Type", "application/json")

	// Send the request using http.Client
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		logger.Log.Errorf("error sending request: %v", err)
		return nil, fmt.Errorf("error sending request: %v", err)
	}
	defer resp.Body.Close()

	// Read the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		logger.Log.Errorf("error reading response body: %v", err)
		return nil, fmt.Errorf("error reading response body: %v", err)
	}

	// Check if the status code is not 200 (OK)
	if resp.StatusCode != http.StatusOK {
		logger.Log.Errorf("error: status code %d, response: %s", resp.StatusCode, body)
		return body, fmt.Errorf("error: status code %d, response: %s", resp.StatusCode, body)
	}

	return body, nil
}
