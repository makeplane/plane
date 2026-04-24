# Mobile Debugging Strategies

Comprehensive debugging techniques, tools, and best practices for mobile development (2024-2025).

## Mobile Debugging Mindset

### Unique Mobile Challenges

1. **Device Diversity** - Thousands of device/OS combinations
2. **Resource Constraints** - Limited CPU, memory, battery
3. **Network Variability** - From WiFi to 2G, offline scenarios
4. **Platform Differences** - iOS vs Android behavior
5. **Real Device Testing** - Simulators don't show real performance
6. **Limited Debugging Access** - Can't SSH into production devices

### Debugging Philosophy

**Golden Rules:**
1. **Test on real devices** - Simulators lie about performance
2. **Reproduce consistently** - Intermittent bugs need reproducible steps
3. **Check the obvious first** - Network, permissions, resources
4. **Isolate the platform** - Is it iOS-specific, Android-specific, or both?
5. **Monitor resources** - CPU, memory, battery, network
6. **Read the logs** - Device logs contain critical clues

## Platform-Specific Debugging Tools

### iOS Debugging

**1. Xcode Debugger**

```swift
// Breakpoint debugging
func fetchUserData(userId: String) {
    // Set breakpoint here
    let url = URL(string: "https://api.example.com/users/\(userId)")!

    // LLDB commands:
    // po userId - print object
    // p url - print variable
    // bt - backtrace
    // c - continue
    // step - step into
    // next - step over
}
```

**LLDB Advanced Commands:**
```bash
# Conditional breakpoint
breakpoint set --name fetchUserData --condition userId == "123"

# Watchpoint (break on value change)
watchpoint set variable self.counter

# Print view hierarchy
po UIApplication.shared.keyWindow?.value(forKey: "recursiveDescription")

# Print all properties
po self.value(forKey: "description")
```

**2. Instruments (Performance Profiling)**

**Time Profiler** - CPU usage
```
1. Xcode → Product → Profile
2. Select "Time Profiler"
3. Record while using app
4. Identify hot methods (high self time)
```

**Allocations** - Memory usage
```
1. Select "Allocations" instrument
2. Look for memory growth
3. Filter by object type
4. Find allocation stack trace
```

**Leaks** - Memory leaks
```
1. Select "Leaks" instrument
2. Leaks shown in red
3. Click leak for stack trace
4. Fix retain cycles
```

**Network** - API debugging
```
1. Select "Network" instrument
2. See all HTTP requests
3. Response times, sizes
4. Failed requests highlighted
```

**3. View Debugging**

```swift
// View hierarchy in Xcode
// Debug → View Debugging → Capture View Hierarchy

// Runtime inspection
#if DEBUG
import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Hello")
        }
        .onAppear {
            // Print view tree for debugging
            print(Mirror(reflecting: self.body))
        }
    }
}
#endif
```

**4. Console.app (System Logs)**

```bash
# Filter logs by process
log stream --predicate 'processImagePath contains "YourApp"' --level debug

# Filter by subsystem
log stream --predicate 'subsystem == "com.yourcompany.yourapp"'

# Show only errors
log stream --predicate 'processImagePath contains "YourApp"' --level error
```

**5. Network Link Conditioner**

```
Settings → Developer → Network Link Conditioner

Simulate:
- 3G, LTE, WiFi
- High latency
- Packet loss
- Bandwidth limits
```

### Android Debugging

**1. Android Studio Debugger**

```kotlin
// Breakpoint debugging
fun fetchUserData(userId: String) {
    // Set breakpoint here
    val url = "https://api.example.com/users/$userId"

    // Debugger commands:
    // Evaluate expression: Alt+F8 (Windows) / Cmd+F8 (Mac)
    // Step over: F8
    // Step into: F7
    // Resume: F9
}
```

**Advanced Debugger Features:**
```kotlin
// Conditional breakpoint
// Right-click breakpoint → Condition: userId == "123"

// Logpoint (log without stopping)
// Right-click breakpoint → More → Check "Evaluate and log"

// Exception breakpoint
// Run → View Breakpoints → + → Java Exception Breakpoints
```

**2. Android Profiler**

**CPU Profiler:**
```
View → Tool Windows → Profiler → CPU
- Record trace
- Identify slow methods
- Flame chart shows call hierarchy
```

**Memory Profiler:**
```
View → Tool Windows → Profiler → Memory
- Track allocations
- Heap dump analysis
- Find memory leaks
```

**Network Profiler:**
```
View → Tool Windows → Profiler → Network
- All HTTP requests
- Request/response details
- Timeline view
```

**3. Layout Inspector**

```
Tools → Layout Inspector

Features:
- 3D view hierarchy
- Live layout updates
- View properties
- Constraints visualization
```

**4. ADB (Android Debug Bridge)**

```bash
# View device logs
adb logcat

# Filter by app
adb logcat | grep com.yourcompany.yourapp

# Filter by tag
adb logcat MyTag:D *:S

# Clear logs
adb logcat -c

# Install APK
adb install app-debug.apk

# Uninstall app
adb uninstall com.yourcompany.yourapp

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Screen recording
adb shell screenrecord /sdcard/demo.mp4
adb pull /sdcard/demo.mp4
```

**5. Network Simulation**

```bash
# Emulator network throttling
# Settings → Network → Network Profile

# Or via ADB
adb shell setprop net.dns1 8.8.8.8
```

### React Native Debugging

**1. React DevTools**

```bash
# Install
npm install -g react-devtools

# Launch
react-devtools

# In app: Shake device → "Debug with React DevTools"
```

**2. Flipper (Recommended)**

```bash
# Install
npm install -g flipper

# Configure in app
# Add flipper packages to your app
npm install --save-dev react-native-flipper

# Features:
# - Layout inspector
# - Network inspector
# - Redux DevTools
# - Database viewer
# - Shared Preferences viewer
```

**3. Chrome DevTools**

```javascript
// In app: Shake device → "Debug"
// Opens Chrome DevTools

// Console.log appears in Chrome
console.log('User data:', userData);

// Set breakpoints in source code
debugger; // Pauses execution

// Network tab shows API calls
fetch('https://api.example.com/users')
  .then(res => res.json())
  .then(data => console.log(data));
```

**4. React Native Debugger (Standalone)**

```bash
# Install
brew install --cask react-native-debugger

# Launch
open "rndebugger://set-debugger-loc?host=localhost&port=8081"

# Features:
# - Redux DevTools
# - React DevTools
# - Network Inspector
# - Console
```

**5. Performance Monitor**

```javascript
// Show in-app performance overlay
// Shake device → "Show Perf Monitor"

// Shows:
// - RAM usage
// - JS frame rate
// - UI frame rate
// - Views count
```

**6. LogBox**

```javascript
// Ignore specific warnings
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Warning: componentWillReceiveProps',
]);

// Ignore all logs (NOT recommended)
LogBox.ignoreAllLogs();
```

### Flutter Debugging

**1. DevTools**

```bash
# Launch from VS Code
# Debug → Open DevTools

# Or from command line
flutter pub global activate devtools
flutter pub global run devtools

# Features:
# - Widget inspector
# - Timeline view
# - Memory profiler
# - Network profiler
# - Logging view
```

**2. Widget Inspector**

```dart
// In DevTools: Inspector tab

// Debug paint (show layout borders)
// Ctrl+Shift+P → "Toggle Debug Painting"

// Print widget tree
debugDumpApp();

// Print render tree
debugDumpRenderTree();

// Print layer tree
debugDumpLayerTree();
```

**3. Performance Overlay**

```dart
void main() {
  runApp(
    MaterialApp(
      showPerformanceOverlay: true, // FPS counter
      debugShowCheckedModeBanner: false,
      home: MyApp(),
    ),
  );
}
```

**4. Logging**

```dart
import 'dart:developer' as developer;

// Simple print
print('User ID: $userId');

// Structured logging
developer.log(
  'User logged in',
  name: 'app.auth',
  error: error,
  stackTrace: stackTrace,
);

// Timeline events
developer.Timeline.startSync('fetchUsers');
await fetchUsers();
developer.Timeline.finishSync();
```

**5. Breakpoint Debugging**

```dart
// Set breakpoints in VS Code or Android Studio
Future<User> fetchUser(String id) async {
  // Breakpoint here
  final response = await http.get(Uri.parse('https://api.example.com/users/$id'));

  // Debugger console commands:
  // p variable - print variable
  // Step over: F10
  // Step into: F11
  // Continue: F5
  return User.fromJson(jsonDecode(response.body));
}
```

## UI Debugging

### Layout Issues

**iOS (SwiftUI):**
```swift
struct ContentView: View {
    var body: some View {
        VStack {
            Text("Hello")
        }
        .border(Color.red) // Debug border
        .background(Color.yellow.opacity(0.3)) // Debug background
    }
}

// Print layout info
Text("Hello")
    .onAppear {
        print("Frame: \(UIScreen.main.bounds)")
    }
```

**Android (Jetpack Compose):**
```kotlin
@Composable
fun DebugLayout() {
    Column(
        modifier = Modifier
            .border(2.dp, Color.Red) // Debug border
            .background(Color.Yellow.copy(alpha = 0.3f)) // Debug background
    ) {
        Text("Hello")
    }
}

// Show layout bounds in developer options
// Settings → Developer Options → Show layout bounds
```

**React Native:**
```javascript
// Debug borders
<View style={{ borderWidth: 1, borderColor: 'red' }}>
  <Text>Hello</Text>
</View>

// Layout animation debugging
import { LayoutAnimation, UIManager } from 'react-native';

UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

// Inspector
// Shake device → "Toggle Inspector"
// Shows element hierarchy and styles
```

**Flutter:**
```dart
// Debug paint
void main() {
  debugPaintSizeEnabled = true; // Show layout guides
  debugPaintBaselinesEnabled = true; // Show text baselines
  debugPaintLayerBordersEnabled = true; // Show layer borders
  runApp(MyApp());
}

// Widget boundaries
Container(
  decoration: BoxDecoration(
    border: Border.all(color: Colors.red, width: 2),
  ),
  child: Text('Hello'),
)
```

### Animation Debugging

**Slow Animations:**
```dart
// Flutter: Slow down animations
timeDilation = 5.0; // 5x slower

// React Native: Slow animations
import { Animated } from 'react-native';
Animated.timing(value, {
  toValue: 1,
  duration: 3000, // Increase duration
});
```

**Animation Performance:**
```swift
// iOS: Core Animation Instrument
// Instruments → Core Animation
// Check for:
// - Dropped frames
// - Off-screen rendering
// - Blending layers
```

## Performance Debugging

### Frame Rate Issues (< 60 FPS)

**Diagnosis:**

**React Native:**
```javascript
// Enable performance monitor
// Shows JS and UI thread FPS

// Common issues:
// 1. Heavy computations in render
// 2. Large lists without virtualization
// 3. Unnecessary re-renders
```

**Solutions:**
```javascript
// ❌ Bad: Heavy computation in render
function UserList({ users }) {
  const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));
  return <FlatList data={sortedUsers} />;
}

// ✅ Good: Memoize expensive operations
function UserList({ users }) {
  const sortedUsers = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );
  return <FlatList data={sortedUsers} />;
}

// ❌ Bad: ScrollView with large data
<ScrollView>
  {users.map(user => <UserCard key={user.id} user={user} />)}
</ScrollView>

// ✅ Good: FlatList with virtualization
<FlatList
  data={users}
  renderItem={({ item }) => <UserCard user={item} />}
  keyExtractor={item => item.id}
  windowSize={5}
  initialNumToRender={10}
/>
```

**Flutter:**
```dart
// Check for:
// - Build phase too long
// - Layout phase too long
// - Paint phase too long

// Use const constructors
// ❌ Bad
Widget build(BuildContext context) {
  return Container(child: Text('Hello'));
}

// ✅ Good
Widget build(BuildContext context) {
  return const Text('Hello');
}

// Avoid expensive builds
// Use keys for stateful widgets
ListView.builder(
  itemBuilder: (context, index) {
    return UserCard(
      key: ValueKey(users[index].id), // Preserve state
      user: users[index],
    );
  },
)
```

### Memory Issues

**Detection:**

**iOS:**
```
Xcode → Debug Navigator → Memory
- Watch memory graph
- Look for continuous growth
```

**Android:**
```
Android Studio → Profiler → Memory
- Take heap dump
- Analyze retained objects
```

**Common Causes:**

```javascript
// React Native: Memory leaks

// ❌ Bad: Event listener not removed
useEffect(() => {
  EventEmitter.on('data', handleData);
  // Missing cleanup
}, []);

// ✅ Good: Cleanup
useEffect(() => {
  EventEmitter.on('data', handleData);
  return () => {
    EventEmitter.off('data', handleData);
  };
}, []);

// ❌ Bad: Timer not cleared
useEffect(() => {
  setInterval(() => {
    console.log('tick');
  }, 1000);
}, []);

// ✅ Good: Clear timer
useEffect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

```dart
// Flutter: Dispose controllers
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }

  @override
  void dispose() {
    _controller.dispose(); // Must dispose
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return TextField(controller: _controller);
  }
}
```

## Network Debugging

### HTTP Debugging

**iOS (Proxyman / Charles)**
```
1. Install Proxyman (free) or Charles
2. Configure device proxy
3. Install SSL certificate
4. View all HTTP traffic
```

**Android (Charles / Flipper)**
```
1. Install Charles Proxy
2. Configure device proxy: Settings → WiFi → Modify → Proxy
3. Install Charles certificate
4. View all HTTP requests/responses
```

**React Native (Flipper Network Plugin)**
```javascript
// Automatically captures all fetch/axios requests
fetch('https://api.example.com/users')
  .then(res => res.json())
  .then(data => console.log(data));

// View in Flipper:
// - Request/response headers
// - Request/response body
// - Timing information
```

**Flutter (DevTools Network Tab)**
```dart
// Automatically captures HTTP requests
final response = await http.get(
  Uri.parse('https://api.example.com/users')
);

// View in DevTools Network tab:
// - All HTTP requests
// - Headers and body
// - Response times
```

### Network Simulation

**Test scenarios:**
- Slow network (3G, 2G)
- High latency (500ms+)
- Packet loss (10%)
- Offline mode

**iOS:**
```
Settings → Developer → Network Link Conditioner
```

**Android:**
```
Emulator: Settings → Network → Network Profile
```

## Crash Debugging

### Crash Reporting Services

**Firebase Crashlytics (Recommended)**

**React Native:**
```javascript
import crashlytics from '@react-native-firebase/crashlytics';

// Log custom events
crashlytics().log('User pressed purchase button');

// Set user identifier
crashlytics().setUserId(userId);

// Record non-fatal error
try {
  await fetchData();
} catch (error) {
  crashlytics().recordError(error);
}

// Force crash for testing
crashlytics().crash();
```

**Flutter:**
```dart
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

// Catch errors
FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterError;

// Catch async errors
runZonedGuarded(() {
  runApp(MyApp());
}, (error, stackTrace) {
  FirebaseCrashlytics.instance.recordError(error, stackTrace);
});

// Log custom events
FirebaseCrashlytics.instance.log('User pressed purchase');

// Set user ID
FirebaseCrashlytics.instance.setUserIdentifier(userId);
```

**iOS Native:**
```swift
import FirebaseCrashlytics

// Log event
Crashlytics.crashlytics().log("User tapped button")

// Set user ID
Crashlytics.crashlytics().setUserID(userId)

// Record error
Crashlytics.crashlytics().record(error: error)
```

**Android Native:**
```kotlin
import com.google.firebase.crashlytics.FirebaseCrashlytics

// Log event
FirebaseCrashlytics.getInstance().log("User tapped button")

// Set user ID
FirebaseCrashlytics.getInstance().setUserId(userId)

// Record exception
FirebaseCrashlytics.getInstance().recordException(exception)
```

### Analyzing Crash Reports

**iOS (Xcode Organizer):**
```
Window → Organizer → Crashes
- Symbolicated crash logs
- Stack traces
- Crash counts
```

**Android (Play Console):**
```
Play Console → Quality → Crashes & ANRs
- Crash stack traces
- Affected devices
- OS versions
```

**Reading Stack Traces:**
```
Fatal Exception: java.lang.NullPointerException
Attempt to invoke virtual method 'java.lang.String User.getName()' on a null object reference
    at com.example.app.UserService.displayUser(UserService.kt:42)
    at com.example.app.MainActivity.onCreate(MainActivity.kt:23)

Fix:
1. Check line UserService.kt:42
2. User object is null
3. Add null check before accessing getName()
```

## Common Debugging Scenarios

### 1. App Crashes on Startup

**Steps:**
1. Check crash logs
2. Look for initialization errors
3. Verify dependencies loaded
4. Check permissions

**Example:**
```javascript
// React Native: Missing native dependency
// Error: Invariant Violation: Native module cannot be null

// Fix: Link native module
npx react-native link <module-name>
# or
cd ios && pod install
```

### 2. UI Not Updating

**React Native:**
```javascript
// ❌ Bad: Mutating state directly
this.state.users.push(newUser); // Won't trigger re-render

// ✅ Good: Create new state
this.setState({ users: [...this.state.users, newUser] });
```

**Flutter:**
```dart
// ❌ Bad: Not calling setState
void addUser(User user) {
  users.add(user); // Won't rebuild
}

// ✅ Good: Call setState
void addUser(User user) {
  setState(() {
    users.add(user);
  });
}
```

### 3. Image Not Loading

**Common causes:**
1. Wrong URL
2. CORS issues
3. SSL certificate issues
4. Network timeout

**Debugging:**
```javascript
// React Native
<Image
  source={{ uri: imageUrl }}
  onError={(error) => console.log('Image error:', error)}
  onLoad={() => console.log('Image loaded')}
/>

// Check network tab for 404, 403, etc.
```

### 4. Keyboard Covering Input

**React Native:**
```javascript
import { KeyboardAvoidingView } from 'react-native';

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <TextInput placeholder="Email" />
</KeyboardAvoidingView>
```

**Flutter:**
```dart
// Automatically handled by Scaffold
Scaffold(
  resizeToAvoidBottomInset: true, // Default
  body: TextField(),
)
```

### 5. Navigation Not Working

**React Navigation:**
```javascript
// ❌ Bad: Navigation prop not available
function MyComponent() {
  navigation.navigate('Home'); // Error
}

// ✅ Good: Use hook or prop
function MyComponent({ navigation }) {
  // or
  // const navigation = useNavigation();

  navigation.navigate('Home');
}
```

## Production Debugging

### Remote Logging

**LogRocket (Session Replay)**
```javascript
import LogRocket from '@logrocket/react-native';

LogRocket.init('your-app-id');

// Identify users
LogRocket.identify(userId, {
  name: user.name,
  email: user.email,
});

// Replays user sessions with:
// - Console logs
// - Network requests
// - UI interactions
// - Redux actions
```

### Feature Flags for Debugging

```javascript
import { useFlags } from 'launchdarkly-react-native-client-sdk';

function MyComponent() {
  const { debugMode } = useFlags();

  if (debugMode) {
    console.log('Debug info:', userData);
  }

  return <View>...</View>;
}

// Enable debug mode remotely for specific users
```

### A/B Testing for Bug Investigation

```javascript
// Gradually roll out fix
if (abTest.variant === 'fixed') {
  return <FixedComponent />;
} else {
  return <OriginalComponent />;
}

// Monitor crash rates per variant
```

## Debugging Checklist

**Before Filing Bug:**
- [ ] Reproduce on real device
- [ ] Check both iOS and Android
- [ ] Test on multiple OS versions
- [ ] Verify network connectivity
- [ ] Check app permissions
- [ ] Review recent code changes
- [ ] Check crash logs

**Investigation:**
- [ ] Enable debug logging
- [ ] Use platform debugger
- [ ] Profile performance if slow
- [ ] Monitor memory usage
- [ ] Check network requests
- [ ] Inspect UI hierarchy

**Production Issues:**
- [ ] Check crash reporting dashboard
- [ ] Review user-reported issues
- [ ] Analyze affected OS versions
- [ ] Check affected devices
- [ ] Review recent app releases
- [ ] Compare crash-free rates

**After Fix:**
- [ ] Test on real devices
- [ ] Verify on affected OS versions
- [ ] Add regression test
- [ ] Staged rollout (10% → 100%)
- [ ] Monitor crash rates

## Resources

**General:**
- React Native Debugging: https://reactnative.dev/docs/debugging
- Flutter DevTools: https://docs.flutter.dev/tools/devtools
- iOS Debugging: https://developer.apple.com/documentation/xcode/debugging
- Android Debugging: https://developer.android.com/studio/debug

**Crash Reporting:**
- Firebase Crashlytics: https://firebase.google.com/docs/crashlytics
- Sentry: https://docs.sentry.io/platforms/react-native/
- Bugsnag: https://docs.bugsnag.com/

**Performance:**
- iOS Instruments: https://developer.apple.com/instruments/
- Android Profiler: https://developer.android.com/studio/profile
- Flipper: https://fbflipper.com/

**Network:**
- Proxyman: https://proxyman.io/
- Charles Proxy: https://www.charlesproxy.com/
- Flipper Network Plugin: https://fbflipper.com/docs/features/network-plugin/
