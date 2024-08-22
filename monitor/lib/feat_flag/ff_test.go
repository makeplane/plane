package feat_flag

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// func TestNewFlags(t *testing.T) {
// 	ctx, cancel := context.WithCancel(context.Background())
// 	defer cancel()
//
// 	options := FlagsOptions{
// 		FlagRefeshInterval: 5 * time.Minute,
// 		FlagRetryInterval:  5 * time.Second,
// 	}
//
// 	flags := IntantiateFlags(ctx, options)
//
// 	if flags.Features == nil {
// 		t.Fatalf("Expected non-nil Features channel")
// 	}
// }
//
// func TestRefreshFlags(t *testing.T) {
// 	ctx, cancel := context.WithCancel(context.Background())
// 	defer cancel()
//
// 	options := FlagsOptions{
// 		FlagRefeshInterval: 5 * time.Minute,
// 		FlagRetryInterval:  5 * time.Second,
// 	}
//
// 	features := make(chan map[string]interface{})
// 	go refreshFlags(ctx, features, options)
//
// 	select {
// 	case <-time.After(options.FlagRefeshInterval):
// 		t.Fatalf("Expected flags to be refreshed within the interval")
// 	case flags := <-features:
// 		if len(flags) == 0 {
// 			t.Fatalf("Expected non-empty flags map")
// 		}
// 		if !flags["feature1"].(bool) || !flags["feature2"].(bool) || !flags["feature3"].(bool) {
// 			t.Fatalf("Expected all features to be true")
// 		}
// 	}
//
// 	// Test context cancellation
// 	cancel()
// 	select {
// 	case <-features:
// 		t.Fatalf("Expected no more flags after context cancellation")
// 	case <-time.After(2 * time.Second):
// 		// Expected behavior
// 	}
// }

func TestDecryptData(t *testing.T) {
	// Provided private key string (replace with actual key)
	privateKeyPEM := `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC+sYXDg1X6H9lT
nDlL+w5hLczfBmiMygjj98DXY/3IqXtT7qz5Lcmwbu9HBRA6xKMQIRB8wvMoWF6p
Ywi1NdkI+ZN483ed7ypAUuNvF2s4xl3hfrlcsptSW8Bl8+LE4jtwgtc/KyeRpCWO
ctEYbxW1RJ8M3/U3SW4bUp6Q4xX4uSoHeGXIVikQfz9m4UkFZL0/o/jP0boYatYx
pROZzwS2WsUivhjGryGnagXaId5/gbZPfxysJ6SoXGfuTDWKDB/UBohLvK9ql05e
MhkZEVW97tHyGNL/lRLpSyZkeGekbhUlN+jXR+leFF+boO2TeZ4xDh16v57zopZX
ngBlb0KlAgMBAAECggEAHhIDXGnVAHzOOfuMI3mi8lsVD+RET1M6pKw4ah638dEc
BAfCmgaI4/wSWlonjYTdi9kS7wGU83s/7ikSQfUMVPh6M1v9NFf3Cy6m86k3PLw3
KKxhkYcOrCWQyOL1EwPzyJGxXKIy+qnuTDC53UcDHtMD27VjR0Uaik90dreAivht
8gZkQ8znxzvq4jVkhAx+wN9vZUyvYFppXg1tmTKOozefGZuDnDn9zpQiFsXmdCMv
mJTj3uzydq1qeGfzKWceo6JtNMBSVTfQO6vX7ZetPqNSR4PtE80NwiTwALYciAOa
k4bJ+NL051DO6lPcrd2rvAXQDXiwwrAE8dk7MJL5LwKBgQDzJryVhjA4XXxJDXZS
FOgdT7+XoIYol2cL1fZTvqNvaPq0egMHL5NnuarZqewIXxXF2SDDw46VhUCUR6xa
0ZAO5+jE6kF0AQ6KEdw0WXQDP7/GcLDQNAgRmhKP/8y5eYhWRruzkjjjy/XSgPKl
vWuC3Hp4nZN8Gzy8JeXiJpeAzwKBgQDIxSech+zNlRU3RaGK9lt8S1frTeLH8CtY
TJO+sFMCz06klpU2boe9urgbzersD4+tu+b2dZBkUqkOpft7apWBWnig7oduDm8O
J4xQWDqAM2KIynblb3W7HWN2ju2ERqmvYjw2EnCqO11adKscFY9vjF+F6t1ugAsy
t9PDF3CaSwKBgByJ02CJW2eCMXAxkE2Z/pRSI96cDKL/Ai01c6/olC4jWCmOmIRj
ZR2rgQ4DD5z77AZIsbvIXBfYh/ffYa9XIV1egsd55yzCYv55kirixOcMuGmGGHqX
YMsQFlWoZFLwnLvjmWw+IUc7TSLj15b0YIX/crBtbj4GxF4g5JZiiS2pAoGBAK2v
oe0QyhOv/YKrgm0tY0fMBmtSHfbKFzV0SfyVnbq4jVhlzQAh7tx8Q/oJ0koVzD6I
Z+6fFiM0P3ykq0LBmkUld2YB9LeJVRnxrLl1Gmb+DSg5v1INctRFQF64l1Hvr6xC
V8SPf1hFsyUl+UF6hXQDBEBeRuHpc8aUsWX9STSxAoGBAJYbicmSnr/nq6YpdBOG
6kHHq8rce3+PE5Sl024bHHOfekonf5GLoJ2/ZV62PsFCC6HoZXanNKi9KsIYlhVw
S0W6nSr+Bsfaupg0lOFsH6JIt42+6Vsxlw2BYC2Z273Un8ANDILTi+HHBbVjI3H0
sb360QcVBrcdb4shNVVK4zBG
-----END PRIVATE KEY-----`

	// Decode the provided private key
	privKey, err := parsePrivateKey([]byte(privateKeyPEM))
	if err != nil {
		t.Fatalf("Failed to parse private key: %v", err)
	}

	// Provided encrypted data (replace with actual data)
	encryptedData := EncryptedData{
		AesKey:     "ZdymIbyyw3TEacX/fd83BnFHODhzvE1F2VKs82IjcmMtLr/R/yx2xrmLQotKmNFHjl7r+4mHfsHKUwHJkM3BMaaf89k/jmveSRlSU5x3hMnFMrlMeXANNP/Zm9Qh33a6U/WjBjHRcQjzPeMxLR7KHJbhoMW/bJ1HuQpyJJZAdh17a4euWM9ED2+Gkm0Eajq5riR0ZCd2buy5RFI5MJdwYm/HZxVrCa9Zp037brqETVl0dcJKqDgxGLOTyL4w2BULhhxo2hBtd9U73unEL2FOXghozcoRHzTxLVnU+7/7UL/k1LL5F29PjdOx1ThNJIMggeYZUneZ2QWu9k2U97eWOg==",
		Nonce:      "LQ6WN0YOtNYCfUn3FJCsOQ==",
		CipherText: "TsY=",
		Tag:        "WVMnyrsqWGsVdppRNNYHsg==",
	}

	// Call the function
	data, err := decryptWithPrivateKey(encryptedData, privKey)
	if err != nil {
		t.Fatalf("Failed to decrypt data: %v", err)
	}

	// Verify the decrypted data
	expected := map[string]interface{}{"key": "value"}
	if assert.Equal(t, data, expected) {
		t.Fatalf("Decrypted data does not match expected: got %v, want %v", data, expected)
	}
}
