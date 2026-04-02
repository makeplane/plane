# Mobile Frameworks Reference

Comprehensive guide to mobile development frameworks: React Native, Flutter, and native development.

## Framework Overview (2024-2025)

### React Native
- **Language**: JavaScript/TypeScript
- **Stars**: 121,000+ on GitHub
- **Adoption**: 35% of mobile developers, 67% familiarity
- **Performance**: 80-90% native performance
- **Architecture**: Bridge-based (legacy) → New Architecture (JSI, Fabric, Codegen)
- **Rendering**: Native components
- **Hot Reload**: Yes
- **Community**: Huge (npm ecosystem, 3M+ downloads/week)

### Flutter
- **Language**: Dart
- **Stars**: 170,000+ on GitHub (fastest-growing)
- **Adoption**: 46% of mobile developers
- **Performance**: 85-95% native performance
- **Architecture**: "Everything is a widget"
- **Rendering**: Custom Impeller rendering engine (eliminates jank)
- **Hot Reload**: Yes (fastest in industry)
- **Community**: Growing rapidly (23,000+ packages on pub.dev)

### Native iOS (Swift/SwiftUI)
- **Language**: Swift
- **Performance**: 100% native
- **UI Framework**: SwiftUI (declarative) or UIKit (imperative)
- **Latest**: Swift 6 with compile-time data race detection
- **Tooling**: Xcode 16, Swift Package Manager
- **Concurrency**: async/await, actors, @MainActor

### Native Android (Kotlin/Jetpack Compose)
- **Language**: Kotlin
- **Performance**: 100% native
- **UI Framework**: Jetpack Compose (declarative) or Views (imperative)
- **Latest**: Kotlin 2.1, Compose 1.7
- **Tooling**: Android Studio Hedgehog+
- **Coroutines**: Kotlin coroutines for async

## React Native Deep Dive

### Core Concepts

**New Architecture (0.82+ Mandatory)**
- **JSI (JavaScript Interface)**: Direct JS-to-native communication, eliminating bridge
- **Fabric**: New rendering system with synchronous layout
- **Codegen**: Static type safety between JS and native code
- **Turbo Modules**: Lazy-loaded native modules

**Performance Optimizations**
- **Hermes Engine**: 30-40% faster startup, reduced memory
- **Native Driver Animations**: Offloaded to UI thread (60 FPS)
- **FlatList Virtualization**: Renders only visible items
- **Image Optimization**: FastImage library, progressive loading

### Best Practices

**Project Structure (Feature-Based)**
```
src/
├── features/
│   ├── auth/
│   ├── profile/
│   └── dashboard/
├── shared/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── navigation/
├── services/
└── stores/
```

**State Management (2024-2025)**
1. **Zustand** (Rising Star): Minimal boilerplate, 3KB, excellent TypeScript
2. **Redux Toolkit**: Enterprise apps, time-travel debugging, DevTools
3. **Recoil**: Meta-built, atom-based, experimental
4. **Context API**: Simple apps, avoid prop drilling

**Navigation**
- **React Navigation**: Industry standard, 80%+ adoption
- Type-safe navigation with TypeScript
- Deep linking configuration
- Tab, stack, drawer navigators

**TypeScript Adoption**
- 85%+ of new React Native projects use TypeScript
- Type safety prevents 15% of runtime errors
- Better IDE support and autocomplete

### Testing Strategy

**Unit Testing**
- **Jest**: Default test runner
- **React Native Testing Library**: Component testing, best practices
- Target: 70-80%+ code coverage

**E2E Testing**
- **Detox**: Gray-box testing, fast, reliable (recommended)
- **Appium**: Cross-platform, WebDriver-based
- **Maestro**: New player, simple YAML-based tests

**Example (React Native Testing Library)**
```javascript
import { render, fireEvent, waitFor } from '@testing-library/react-native';

test('login button should be enabled when form is valid', async () => {
  const { getByTestId } = render(<LoginScreen />);
  const emailInput = getByTestId('email-input');
  const passwordInput = getByTestId('password-input');
  const loginButton = getByTestId('login-button');

  fireEvent.changeText(emailInput, 'test@example.com');
  fireEvent.changeText(passwordInput, 'password123');

  await waitFor(() => {
    expect(loginButton).not.toBeDisabled();
  });
});
```

### When to Choose React Native

**✅ Best For:**
- JavaScript/TypeScript expertise in team
- Code sharing with web (React)
- Rapid prototyping and MVPs
- Strong community support needed
- npm ecosystem integration
- Commercial apps (12.57% market share)

**❌ Not Ideal For:**
- Heavy graphics/gaming (use native or Unity)
- Maximum performance critical
- Deep platform-specific integrations
- Team unfamiliar with JavaScript

## Flutter Deep Dive

### Core Concepts

**"Everything is a Widget"**
- UI built from composable widgets
- Immutable widget tree
- Reactive updates with setState/state management

**Rendering Engine**
- **Impeller**: New rendering engine (iOS stable, Android preview)
- Eliminates shader jank
- 120 FPS capable on capable devices
- Custom Skia-based rendering (full control)

**Performance Features**
- **Const widgets**: Compile-time optimization
- **RepaintBoundary**: Isolate expensive repaints
- **ListView.builder**: Lazy loading for long lists
- **Cached network images**: Image optimization

### Best Practices

**Project Structure (Feature-First)**
```
lib/
├── features/
│   ├── auth/
│   │   ├── data/
│   │   ├── domain/
│   │   └── presentation/
│   └── profile/
├── core/
│   ├── theme/
│   ├── utils/
│   └── widgets/
├── routing/
└── main.dart
```

**State Management (2024-2025)**
1. **Riverpod 3**: Modern, compile-safe, recommended by Flutter team
2. **Bloc**: Enterprise apps, event-driven, predictable state
3. **Provider**: Beginners, simple apps
4. **GetX**: All-in-one (state + routing + DI), opinionated

**Navigation**
- **GoRouter**: Official recommendation (2024+), declarative routing
- Type-safe routes with code generation
- Deep linking built-in
- Replaces Navigator 2.0 for most use cases

**Priority Levels (Official)**
1. **P0**: Fix immediately (crashes, data loss)
2. **P1**: Fix within days (major features broken)
3. **P2**: Fix within weeks (annoyances)
4. **P3**: Nice to have

### Testing Strategy

**Unit Testing**
- **flutter_test**: Built-in testing package
- **Mockito**: Mocking dependencies
- Target: 80%+ code coverage

**Widget Testing**
- **WidgetTester**: Test UI and interactions
- **Golden Tests**: Visual regression testing

**Integration Testing**
- **integration_test**: End-to-end testing
- Run on real devices or emulators

**Example (Widget Testing)**
```dart
testWidgets('Counter increments', (WidgetTester tester) async {
  await tester.pumpWidget(MyApp());

  expect(find.text('0'), findsOneWidget);
  expect(find.text('1'), findsNothing);

  await tester.tap(find.byIcon(Icons.add));
  await tester.pump();

  expect(find.text('0'), findsNothing);
  expect(find.text('1'), findsOneWidget);
});
```

### When to Choose Flutter

**✅ Best For:**
- Performance-critical applications
- Complex animations and custom UI
- Multi-platform (mobile, web, desktop)
- Consistent UI across platforms
- Growing team/startup (fastest development)
- Apps with heavy visual requirements

**❌ Not Ideal For:**
- Team unfamiliar with Dart
- Heavy reliance on native platform features
- Existing large JavaScript/native codebase
- Small app size critical (<20MB)

## Native iOS (Swift/SwiftUI)

### Core Concepts

**Swift 6 (2024-2025)**
- Compile-time data race detection
- Enhanced concurrency: async/await, actors, @MainActor
- Powerful macro system
- Move semantics for performance

**SwiftUI vs UIKit**
- **SwiftUI**: Declarative, 40% less code, iOS 13+, modern approach
- **UIKit**: Imperative, fine-grained control, legacy support, complex customizations
- Both work together in same project

### Architecture Patterns

**MVVM (Most Popular)**
```swift
// ViewModel (ObservableObject)
class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false

    func login() async {
        isLoading = true
        // Login logic
        isLoading = false
    }
}

// View
struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()

    var body: some View {
        VStack {
            TextField("Email", text: $viewModel.email)
            SecureField("Password", text: $viewModel.password)
            Button("Login") {
                Task { await viewModel.login() }
            }
        }
    }
}
```

**TCA (The Composable Architecture)**
- Growing adoption (v1.13+)
- Excellent for complex apps
- Steeper learning curve
- Predictable state management

### When to Choose Native iOS

**✅ Best For:**
- iOS-only applications
- Maximum performance required
- Latest Apple features (WidgetKit, Live Activities, App Clips)
- Deep iOS ecosystem integration
- Team with Swift/iOS expertise

## Native Android (Kotlin/Jetpack Compose)

### Core Concepts

**Kotlin 2.1 (2024-2025)**
- Null safety by design
- Coroutines for async
- Sealed classes for type-safe states
- Extension functions

**Jetpack Compose**
- Declarative UI (like SwiftUI/React)
- 60% adoption in top 1,000 apps
- Material Design 3 integration
- Compose compiler with Kotlin 2.0+

### Architecture Patterns

**MVVM + Clean Architecture**
```kotlin
// ViewModel
class LoginViewModel(
    private val loginUseCase: LoginUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            loginUseCase(email, password)
                .onSuccess { /* Navigate */ }
                .onFailure { /* Show error */ }
            _uiState.update { it.copy(isLoading = false) }
        }
    }
}

// Composable
@Composable
fun LoginScreen(viewModel: LoginViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsState()

    Column {
        TextField(
            value = uiState.email,
            onValueChange = { /* update */ }
        )
        Button(onClick = { viewModel.login() }) {
            Text("Login")
        }
    }
}
```

### When to Choose Native Android

**✅ Best For:**
- Android-only applications
- Maximum performance required
- Material Design 3 implementation
- Deep Android ecosystem integration
- Team with Kotlin/Android expertise

## Framework Comparison Matrix

| Feature | React Native | Flutter | Native iOS | Native Android |
|---------|--------------|---------|------------|----------------|
| **Language** | JavaScript/TS | Dart | Swift | Kotlin |
| **Learning Curve** | Easy | Medium | Medium | Medium |
| **Performance** | 80-90% | 85-95% | 100% | 100% |
| **Hot Reload** | Yes | Yes (fastest) | Previews | Live Edit |
| **Code Sharing** | Web (React) | Web/Desktop | No | No |
| **Community Size** | Huge | Growing | iOS only | Android only |
| **UI Paradigm** | Components | Widgets | Declarative | Declarative |
| **Third-party** | npm (3M+) | pub.dev (23K+) | SPM | Maven |
| **App Size** | 40-50MB | 15-20MB | 10-15MB | 10-15MB |
| **Build Time** | Medium | Fast | Slow (Xcode) | Medium |
| **Debugging** | Chrome/Safari | DevTools | Xcode | Android Studio |
| **Platform Feel** | Needs work | Needs work | Native | Native |
| **Startup Time** | Medium | Fast | Fastest | Fastest |
| **Best For** | JS teams | Performance | iOS-only | Android-only |

## Migration Paths

### React Native → Flutter
- **Effort**: High (complete rewrite)
- **Timeline**: 3-6 months for medium app
- **Benefits**: Better performance, smaller app size
- **Challenges**: New language (Dart), different ecosystem

### Flutter → React Native
- **Effort**: High (complete rewrite)
- **Timeline**: 3-6 months for medium app
- **Benefits**: Larger community, web code sharing
- **Challenges**: Lower performance, larger app size

### Cross-Platform → Native
- **Effort**: Very High (separate iOS and Android apps)
- **Timeline**: 6-12 months for medium app
- **Benefits**: Maximum performance, platform features
- **Challenges**: Maintain two codebases, 2x team size

### Native → Cross-Platform
- **Effort**: High (consolidate to one codebase)
- **Timeline**: 4-8 months for medium app
- **Benefits**: Single codebase, faster development
- **Challenges**: Performance tradeoffs, platform differences

## Decision Framework

### Start Here: Do you need native performance?
- **No** → Cross-platform (React Native or Flutter)
- **Yes** → Native (Swift or Kotlin)

### If Cross-Platform: Does team know JavaScript?
- **Yes** → React Native
- **No** → Flutter

### If Native: iOS-only or Android-only?
- **iOS-only** → Swift/SwiftUI
- **Android-only** → Kotlin/Compose
- **Both** → Reconsider cross-platform

### Additional Factors:
- **Existing codebase**: Use same technology
- **Web app exists**: React Native (code sharing)
- **Desktop needed**: Flutter (multi-platform)
- **Budget constrained**: Cross-platform
- **Performance critical**: Native
- **Complex animations**: Flutter or Native
- **Commercial focus**: React Native (larger market share)

## Resources

**React Native:**
- Official Docs: https://reactnative.dev/
- New Architecture: https://reactnative.dev/docs/the-new-architecture/landing-page
- Expo: https://expo.dev/ (recommended framework)
- Directory: https://reactnative.directory/

**Flutter:**
- Official Docs: https://flutter.dev/
- Pub.dev: https://pub.dev/
- Codelabs: https://flutter.dev/codelabs
- Widget Catalog: https://flutter.dev/widgets

**Native iOS:**
- Swift Docs: https://swift.org/documentation/
- SwiftUI Tutorials: https://developer.apple.com/tutorials/swiftui
- iOS HIG: https://developer.apple.com/design/human-interface-guidelines/

**Native Android:**
- Kotlin Docs: https://kotlinlang.org/docs/home.html
- Compose Docs: https://developer.android.com/jetpack/compose
- Material 3: https://m3.material.io/
- Android Guides: https://developer.android.com/guide
