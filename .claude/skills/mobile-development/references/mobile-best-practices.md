# Mobile Development Best Practices

Cross-platform best practices for modern mobile development (2024-2025).

## Mobile-First Design Principles

### Core Principles
1. **Content First**: Remove chrome, focus on content
2. **Progressive Disclosure**: Hide complexity behind layers
3. **Thumb-Friendly**: Primary actions within reach
4. **Performance Budget**: <2s launch, <1s screen load
5. **Offline-First**: Design for unreliable networks

### Touch Targets
- **iOS**: 44x44px minimum (HIG guideline)
- **Android**: 48x48px minimum (Material Design)
- **Optimal**: 44-57px for important actions
- **Spacing**: 8px minimum between targets

### Typography
- **iOS**: San Francisco (system font)
- **Android**: Roboto (Material)
- **Minimum**: 16px body text (accessibility)
- **Line height**: 1.5x for readability

## Performance Optimization

### Launch Time Optimization
**Targets:**
- Cold start: <2s
- Warm start: <1s
- Hot start: <0.5s

**Techniques:**
- Defer non-critical initialization
- Lazy load dependencies
- Preload critical data only
- Show UI before data ready

### Memory Management
**Targets:**
- Typical screen: <100MB
- Peak usage: <200MB

**Techniques:**
- Image pagination/virtualization
- Release resources in background
- Profile with Instruments/Profiler
- Avoid retain cycles/memory leaks

**React Native Example:**
```javascript
// Use FlatList instead of ScrollView for long lists
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### Network Optimization
**Techniques:**
- Batch API requests
- Cache aggressively
- Compress images (WebP, AVIF)
- Use CDN for static assets
- Implement request deduplication

**Example Strategy:**
```
User opens screen
├─ Show cached data immediately (stale-while-revalidate)
├─ Fetch fresh data in background
└─ Update UI when fresh data arrives
```

### Battery Optimization
**Techniques:**
- Batch network requests
- Reduce GPS accuracy when possible
- Use push instead of polling
- Respect Doze Mode (Android)
- Background App Refresh (iOS)

**Targets:**
- Active use: <5% per hour
- Background: <1% per hour

## Offline-First Architecture

### Local Storage Options
**React Native:**
- AsyncStorage (small data, <6MB)
- Realm (complex objects, relationships)
- SQLite (relational data)
- MMKV (fastest key-value)

**Flutter:**
- SharedPreferences (small data)
- Hive (NoSQL, fast)
- Drift (SQLite wrapper)
- ObjectBox (object database)

**iOS:**
- UserDefaults (small data)
- Core Data (complex objects)
- SwiftData (modern replacement)
- Realm

**Android:**
- SharedPreferences (small data)
- Room (SQLite ORM)
- Realm
- DataStore (Preferences + Proto)

### Data Synchronization Strategies

**1. Write-Through Cache**
```
User makes change
├─ Update local database immediately
├─ Update UI optimistically
├─ Queue sync operation
└─ Sync to server in background
```

**2. Hybrid Sync (Push + Pull)**
```
Push Sync (Real-time)
├─ WebSocket connection for critical updates
└─ Immediate notification of changes

Pull Sync (Periodic)
├─ Periodic polling for non-critical data
├─ Pull on app foreground
└─ Incremental sync (only changes since last sync)
```

**3. Conflict Resolution**
- **Last-write-wins**: Use timestamps
- **Operational transformation**: Merge changes
- **CRDT**: Conflict-free replicated data
- **Manual resolution**: User chooses

### Example: Offline-First Comments

```typescript
// React Native + TypeScript
class CommentService {
  async postComment(text: string, postId: string) {
    const tempId = generateTempId();
    const comment = {
      id: tempId,
      text,
      postId,
      synced: false,
      timestamp: Date.now()
    };

    // 1. Save locally immediately
    await db.comments.insert(comment);

    // 2. Update UI (optimistic)
    eventBus.emit('comment:added', comment);

    // 3. Sync to server in background
    try {
      const serverComment = await api.postComment(text, postId);
      // Replace temp ID with server ID
      await db.comments.update(tempId, {
        id: serverComment.id,
        synced: true
      });
    } catch (error) {
      // Mark as pending sync, retry later
      await db.comments.update(tempId, {
        syncError: error.message
      });
      syncQueue.add({ type: 'comment', id: tempId });
    }
  }
}
```

## Mobile Analytics & Monitoring

### Analytics Platforms (2024-2025)

**Firebase Analytics (Recommended)**
- Free tier generous
- Mobile-specific events
- Integrated with Crashlytics
- AI-powered insights
- Supports all platforms

**Sentry**
- Error tracking + performance
- Cross-platform support
- Source map upload
- Release tracking
- Custom breadcrumbs

**Amplitude**
- Product analytics
- User behavior tracking
- Cohort analysis
- A/B testing integration

### Essential Events to Track

**User Journey:**
- App opened
- Screen viewed
- Feature used
- Conversion events
- User retention

**Performance:**
- App launch time
- Screen load time
- API latency
- Crash-free rate
- ANR rate (Android)

**Business:**
- Purchases
- Subscriptions
- Ad impressions
- Feature adoption
- Referrals

### Crashlytics Integration

**React Native:**
```javascript
import crashlytics from '@react-native-firebase/crashlytics';

// Log events
crashlytics().log('User tapped purchase button');

// Set user attributes
crashlytics().setUserId(user.id);

// Log non-fatal errors
try {
  await riskyOperation();
} catch (error) {
  crashlytics().recordError(error);
}
```

**Flutter:**
```dart
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

// Log events
FirebaseCrashlytics.instance.log('User tapped purchase');

// Set user ID
FirebaseCrashlytics.instance.setUserIdentifier(userId);

// Record errors
await FirebaseCrashlytics.instance.recordError(
  error,
  stackTrace,
  reason: 'API call failed',
);
```

## Push Notifications Best Practices

### Platforms
- **iOS**: APNs (Apple Push Notification service)
- **Android**: FCM (Firebase Cloud Messaging)
- **Cross-platform**: OneSignal, Firebase, AWS SNS

### Best Practices

**1. Permission Request Strategy**
```
❌ Bad: Request permission on app launch
✅ Good: Request after user sees value

Flow:
1. User interacts with feature
2. Show custom modal explaining benefits
3. Request system permission
4. Handle denial gracefully
```

**2. Personalization**
- Segment users by behavior
- Send at optimal times (time zones)
- Personalize content
- A/B test messaging

**3. Frequency**
- Avoid notification spam
- Respect user preferences
- Implement quiet hours
- Group related notifications

**4. Deep Linking**
```javascript
// React Native
import messaging from '@react-native-firebase/messaging';

messaging().onNotificationOpenedApp(remoteMessage => {
  const { screen, params } = remoteMessage.data;
  navigation.navigate(screen, params);
});
```

**Impact:**
- 25% revenue increase with proper personalization
- 88% opt-in rate with pre-permission modal (vs 40% without)

## Authentication & Authorization

### Modern Auth Stack (2024-2025)

**Standard Pattern:**
```
OAuth 2.0 (Authorization)
├─ JWT (Stateless auth tokens)
├─ Refresh tokens (Long-term access)
└─ Biometric (Convenient re-auth)
```

### Implementation

**Biometric Authentication (iOS)**
```swift
import LocalAuthentication

let context = LAContext()
var error: NSError?

if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
    context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics,
                          localizedReason: "Unlock your account") { success, error in
        if success {
            // Authenticated
        }
    }
}
```

**Biometric Authentication (Android)**
```kotlin
import androidx.biometric.BiometricPrompt

val promptInfo = BiometricPrompt.PromptInfo.Builder()
    .setTitle("Biometric login")
    .setSubtitle("Log in using your biometric credential")
    .setNegativeButtonText("Use account password")
    .build()

val biometricPrompt = BiometricPrompt(this, executor,
    object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
            // Authenticated
        }
    })

biometricPrompt.authenticate(promptInfo)
```

### Secure Token Storage

**iOS: Keychain**
```swift
import Security

func saveToken(_ token: String, for key: String) {
    let data = token.data(using: .utf8)!
    let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrAccount as String: key,
        kSecValueData as String: data,
        kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
    ]
    SecItemAdd(query as CFDictionary, nil)
}
```

**Android: EncryptedSharedPreferences**
```kotlin
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()

val sharedPreferences = EncryptedSharedPreferences.create(
    context,
    "secure_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)

sharedPreferences.edit().putString("auth_token", token).apply()
```

**React Native: react-native-keychain**
```javascript
import * as Keychain from 'react-native-keychain';

// Save credentials
await Keychain.setGenericPassword('username', token, {
  accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

// Retrieve credentials
const credentials = await Keychain.getGenericPassword();
const token = credentials.password;
```

## App Store Deployment

### App Store (iOS)

**Requirements (2024-2025):**
- Xcode 15+ with iOS 17 SDK (minimum)
- Xcode 16+ with iOS 18 SDK (recommended for 2025)
- Privacy manifest required
- Account deletion in-app mandatory

**Release Process:**
1. Archive in Xcode
2. Upload to App Store Connect
3. Submit for review
4. Phased release (7-day rollout)

**Review Time:**
- Average: 1-2 days
- Expedited: 1-2 hours (emergencies only)

**Rejection Reasons:**
- Crashes (50%)
- Privacy violations (25%)
- Incomplete information (15%)
- Guideline violations (10%)

### Google Play (Android)

**Requirements (2024-2025):**
- Target Android 14 (API 34) now
- Target Android 15 (API 35) by Aug 31, 2025
- Privacy policy required
- Data safety form required

**Release Process:**
1. Build signed AAB (Android App Bundle)
2. Upload to Play Console
3. Submit to production track
4. Staged rollout (10% → 50% → 100%)

**Review Time:**
- Average: 1-3 days
- Updates: 1-2 days

### Staged Rollout Strategy

**Week 1:**
- 10% of users
- Monitor crash-free rate
- Watch for critical bugs

**Week 2:**
- 50% of users
- Validate performance metrics
- Check user feedback

**Week 3:**
- 100% of users
- Full release if metrics healthy

**Rollback Triggers:**
- Crash-free rate drops >5%
- Critical bug discovered
- Major user complaints

## Cross-Platform Comparison

### Flutter vs React Native (2024-2025)

| Metric | React Native | Flutter |
|--------|--------------|---------|
| **Adoption** | 35% | 46% |
| **Performance** | 80-90% | 85-95% |
| **App Size** | 40-50MB | 15-20MB |
| **Dev Speed** | Fast | Very Fast |
| **Commercial** | 12.57% | 5.24% |
| **Developers** | 20:1 ratio | 1 ratio |
| **Best For** | JS teams | Performance |

### Architecture Comparison

**MVVM (Small Apps):**
```
View
 ↓
ViewModel (business logic)
 ↓
Model (data)
```

**Clean Architecture (Large Apps):**
```
Presentation (UI)
 ↓
Domain (business logic, use cases)
 ↓
Data (repositories, APIs, DB)
```

## Resources

**Performance:**
- iOS: https://developer.apple.com/documentation/xcode/improving-your-app-s-performance
- Android: https://developer.android.com/topic/performance
- React Native: https://reactnative.dev/docs/performance

**Analytics:**
- Firebase: https://firebase.google.com/docs/analytics
- Sentry: https://docs.sentry.io/platforms/react-native/
- Amplitude: https://amplitude.com/docs

**Security:**
- OWASP Mobile: https://owasp.org/www-project-mobile-top-10/
- iOS Security: https://support.apple.com/guide/security/
- Android Security: https://source.android.com/docs/security

**Testing:**
- Detox: https://wix.github.io/Detox/
- Appium: https://appium.io/docs/en/latest/
- XCTest: https://developer.apple.com/documentation/xctest
- Espresso: https://developer.android.com/training/testing/espresso
