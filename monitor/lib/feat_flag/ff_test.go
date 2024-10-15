package feat_flag

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

// func TestDecryptData(t *testing.T) {
// 	// Provided private key string (replace with actual key)
// 	privateKeyPEM := os.Getenv("PRIVATE_KEY")
//
// 	// Decode the provided private key
// 	_, err := ParsePrivateKey(privateKeyPEM)
// 	if err != nil {
// 		t.Fatalf("Failed to parse private key: %v", err)
// 	}
//
// 	var MACHINE_SIGNATURE = ""
// 	var APP_VERSION = ""
// 	var INSTANCE_ID = ""
// 	var HOST = "https://prime.plane.so"
//
// 	if host := os.Getenv(constants.PRIME_HOST); host != "" {
// 		HOST = host
// 	}
//
// 	if appVersion := os.Getenv(constants.APP_VERSION); appVersion == "" {
// 		fmt.Errorf(error_msgs.APP_VERSION_ABSENT)
// 	} else {
// 		APP_VERSION = appVersion
// 	}
//
// 	if instanceId := os.Getenv(constants.INSTANCE_ID); instanceId == "" {
// 		fmt.Errorf(error_msgs.INSTANCE_ID_ABSENT)
// 	} else {
// 		INSTANCE_ID = instanceId
// 	}
//
// 	if machineSignature := os.Getenv(constants.MACHINE_SIGNATURE); machineSignature == "" {
// 		fmt.Errorf(error_msgs.MACHINE_SIG_ABSENT)
// 	} else {
// 		MACHINE_SIGNATURE = machineSignature
// 	}
//
// 	api := prime_api.NewMonitorApi(HOST, MACHINE_SIGNATURE, INSTANCE_ID, APP_VERSION)
//
// 	flags, errorCode := api.GetFeatureFlags()
//
// 	if errorCode != 0 {
// 		t.Fatalf("Failed to get feature flags: %v", err)
// 	}
// 	var decryptedFlags map[string]interface{}
// 	err = GetDecryptedJson(privateKeyPEM, EncryptedData{
// 		CipherText: flags.EncyptedData.CipherText,
// 		AesKey:     flags.EncyptedData.AesKey,
// 		Nonce:      flags.EncyptedData.Nonce,
// 		Tag:        flags.EncyptedData.Tag,
// 	}, &decryptedFlags)
//
// 	if err != nil {
// 		t.Fatalf("Failed to decrypt flags: %v", err)
// 	}
//
// 	fmt.Println(decryptedFlags)
// }
