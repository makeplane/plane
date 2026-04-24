# iOS Native Development

Complete guide to iOS development with Swift and SwiftUI (2024-2025).

## Swift 6 Overview

### Key Features
- **Data race safety**: Compile-time detection (default in Swift 6)
- **Concurrency**: async/await, actors, @MainActor
- **Macro system**: Code generation at compile time
- **Move semantics**: Ownership optimization
- **Enhanced generics**: More powerful type system

### Modern Swift Patterns

**Async/Await:**
```swift
func fetchUser(id: String) async throws -> User {
    let (data, _) = try await URLSession.shared.data(from: url)
    return try JSONDecoder().decode(User.self, from: data)
}

// Usage
Task {
    do {
        let user = try await fetchUser(id: "123")
        self.user = user
    } catch {
        self.error = error
    }
}
```

**Actors (Thread-safe classes):**
```swift
actor UserCache {
    private var cache: [String: User] = [:]

    func get(_ id: String) -> User? {
        cache[id]
    }

    func set(_ id: String, user: User) {
        cache[id] = user
    }
}
```

## SwiftUI vs UIKit

### When to Use SwiftUI
✅ New projects (iOS 13+)
✅ Declarative UI preferred
✅ Fast iteration needed
✅ Cross-platform (macOS, watchOS, tvOS)
✅ 40% less code vs UIKit

### When to Use UIKit
✅ Legacy app maintenance
✅ Complex customizations
✅ Fine-grained control needed
✅ Specific UIKit features required
✅ Pre-iOS 13 support

### SwiftUI Basics

```swift
struct ContentView: View {
    @State private var count = 0

    var body: some View {
        VStack(spacing: 20) {
            Text("Count: \(count)")
                .font(.title)

            Button("Increment") {
                count += 1
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}
```

**Property Wrappers:**
- `@State`: View-local state
- `@Binding`: Two-way binding
- `@StateObject`: Observable object owner
- `@ObservedObject`: Observable object reference
- `@EnvironmentObject`: Dependency injection
- `@Published`: Observable property

## Architecture Patterns

### MVVM (Most Popular)

```swift
// Model
struct User: Identifiable, Codable {
    let id: String
    let name: String
    let email: String
}

// ViewModel
@MainActor
class UserViewModel: ObservableObject {
    @Published var users: [User] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let repository: UserRepository

    init(repository: UserRepository = UserRepository()) {
        self.repository = repository
    }

    func loadUsers() async {
        isLoading = true
        defer { isLoading = false }

        do {
            users = try await repository.fetchUsers()
        } catch {
            self.error = error
        }
    }
}

// View
struct UserListView: View {
    @StateObject private var viewModel = UserViewModel()

    var body: some View {
        List(viewModel.users) { user in
            Text(user.name)
        }
        .task {
            await viewModel.loadUsers()
        }
    }
}
```

### TCA (The Composable Architecture)

**When to use:**
- Complex state management
- Predictable state updates
- Excellent testing
- Enterprise apps

**Trade-offs:**
- Steeper learning curve
- More boilerplate
- Excellent for large teams

## Performance Optimization

### Compiler Optimizations

**1. Use `final` classes:**
```swift
final class FastClass {
    // Compiler can optimize (no dynamic dispatch)
}
```

**2. Private methods:**
```swift
private func optimize() {
    // Compiler can inline
}
```

**3. Whole-module optimization:**
```bash
# Build Settings
SWIFT_WHOLE_MODULE_OPTIMIZATION = YES
```

### Memory Management

**ARC (Automatic Reference Counting):**
```swift
class Parent {
    var child: Child?
}

class Child {
    weak var parent: Parent?  // Weak to avoid retain cycle
}
```

**Common Retain Cycles:**
```swift
// ❌ Bad: Retain cycle
class ViewController: UIViewController {
    var completion: (() -> Void)?

    func setup() {
        completion = {
            self.doSomething()  // Strong capture
        }
    }
}

// ✅ Good: Weak self
class ViewController: UIViewController {
    var completion: (() -> Void)?

    func setup() {
        completion = { [weak self] in
            self?.doSomething()
        }
    }
}
```

### SwiftUI Performance

**1. Use const modifiers:**
```swift
Text("Hello")  // Recreated on every render

vs

Text("Hello")
    .font(.title)  // Modifier creates new view

// Better: Extract static views
let titleText = Text("Hello").font(.title)
```

**2. Avoid expensive computations:**
```swift
struct ExpensiveView: View {
    let data: [Item]

    // Computed every render
    var sortedData: [Item] {
        data.sorted()  // ❌ Bad
    }

    // Better: Cache with @State or pass sorted
}
```

## Testing Strategies

### XCTest (Unit Testing)

```swift
import XCTest
@testable import MyApp

final class UserViewModelTests: XCTestCase {
    var viewModel: UserViewModel!
    var mockRepository: MockUserRepository!

    override func setUp() {
        super.setUp()
        mockRepository = MockUserRepository()
        viewModel = UserViewModel(repository: mockRepository)
    }

    func testLoadUsers() async throws {
        // Given
        let expectedUsers = [User(id: "1", name: "Test", email: "test@example.com")]
        mockRepository.usersToReturn = expectedUsers

        // When
        await viewModel.loadUsers()

        // Then
        XCTAssertEqual(viewModel.users, expectedUsers)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.error)
    }
}
```

### XCUITest (UI Testing)

```swift
import XCTest

final class LoginUITests: XCTestCase {
    let app = XCUIApplication()

    override func setUp() {
        super.setUp()
        app.launch()
    }

    func testLoginFlow() {
        let emailField = app.textFields["emailField"]
        emailField.tap()
        emailField.typeText("test@example.com")

        let passwordField = app.secureTextFields["passwordField"]
        passwordField.tap()
        passwordField.typeText("password123")

        app.buttons["loginButton"].tap()

        XCTAssertTrue(app.staticTexts["Welcome"].waitForExistence(timeout: 5))
    }
}
```

**Target Coverage:**
- Unit tests: 70-80%+
- Critical paths: 100%
- UI tests: Key user flows only (slow)

## iOS-Specific Features

### WidgetKit

```swift
import WidgetKit
import SwiftUI

struct SimpleWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "SimpleWidget", provider: Provider()) { entry in
            SimpleWidgetView(entry: entry)
        }
        .configurationDisplayName("My Widget")
        .description("This is my widget")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
```

### Live Activities (iOS 16.1+)

```swift
import ActivityKit

struct OrderAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var status: String
        var estimatedTime: Date
    }

    var orderId: String
}

// Start activity
let attributes = OrderAttributes(orderId: "123")
let initialState = OrderAttributes.ContentState(
    status: "Preparing",
    estimatedTime: Date().addingTimeInterval(1800)
)

let activity = try Activity.request(
    attributes: attributes,
    contentState: initialState
)
```

### App Clips

**Characteristics:**
- <10MB size limit
- Fast, lightweight experiences
- No installation required
- Invoked via NFC, QR, Safari, Maps

## Human Interface Guidelines (HIG)

### Navigation Patterns

**Tab Bar:**
- 2-5 top-level sections
- Bottom placement
- Always visible
- Immediate navigation

**Navigation Bar:**
- Hierarchical navigation
- Back button automatic
- Title and actions
- Large/inline title modes

**Modal Presentation:**
- Interrupting tasks
- Self-contained flow
- Clear dismiss action
- Use sparingly

### Design Principles

**Clarity:**
- Legible text (minimum 11pt)
- Sufficient contrast (WCAG AA)
- Precise icons

**Deference:**
- Content first, UI second
- Translucent backgrounds
- Minimal UI elements

**Depth:**
- Layering (sheets, overlays)
- Visual hierarchy
- Motion provides meaning

### Colors

**System Colors:**
```swift
Color.primary      // Adaptive black/white
Color.secondary    // Gray
Color.accentColor  // App tint color
Color(uiColor: .systemBlue)
Color(uiColor: .label)
```

**Dark Mode:**
```swift
// Automatic
Color.primary  // Adapts to light/dark

// Custom
Color("CustomColor")  // Define in Assets.xcassets
```

### SF Symbols

```swift
Image(systemName: "star.fill")
    .foregroundColor(.yellow)
    .font(.title)

// Rendering modes
Image(systemName: "heart.fill")
    .symbolRenderingMode(.multicolor)
```

## App Store Requirements (2024-2025)

### SDK Requirements
- **Current**: Xcode 15+ with iOS 17 SDK (required as of April 2024)
- **Upcoming**: Xcode 16+ with iOS 18 SDK (recommended for 2025 submissions)

### Privacy
- **Privacy manifest**: Required for third-party SDKs
- **Tracking permission**: ATT framework for advertising
- **Privacy nutrition labels**: Accurate data collection info
- **Account deletion**: In-app deletion required

### Capabilities
- **Sandbox**: All apps sandboxed
- **Entitlements**: Request only needed capabilities
- **Background modes**: Justify background usage
- **HealthKit**: Privacy-sensitive, strict review

### Submission Checklist
✅ App icons (all required sizes)
✅ Screenshots (all device sizes)
✅ App description and keywords
✅ Privacy policy URL
✅ Support URL
✅ Age rating questionnaire
✅ Export compliance
✅ Test on real devices
✅ No crashes or major bugs

## Common Pitfalls

1. **Strong reference cycles**: Use `[weak self]` in closures
2. **Main thread blocking**: Use async/await, avoid sync operations
3. **Large images**: Resize before displaying
4. **Unhandled errors**: Always handle async throws
5. **Ignoring safe areas**: Use `.ignoresSafeArea()` intentionally
6. **Not testing dark mode**: Design for both appearances
7. **Hardcoded strings**: Use localization from start
8. **Memory leaks**: Profile with Instruments regularly

## Resources

**Official:**
- Swift Documentation: https://swift.org/documentation/
- SwiftUI Tutorials: https://developer.apple.com/tutorials/swiftui
- HIG: https://developer.apple.com/design/human-interface-guidelines/
- WWDC Videos: https://developer.apple.com/videos/

**Community:**
- Hacking with Swift: https://www.hackingwithswift.com/
- Swift by Sundell: https://www.swiftbysundell.com/
- objc.io: https://www.objc.io/
- iOS Dev Weekly: https://iosdevweekly.com/
