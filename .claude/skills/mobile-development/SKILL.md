---
name: mobile-development
description: Build mobile apps with React Native, Flutter, Swift/SwiftUI, Kotlin/Jetpack Compose. Use for iOS/Android, mobile UX, performance optimization, offline-first, app store deployment.
license: MIT
version: 1.0.0
---

# Mobile Development Skill

Production-ready mobile development with modern frameworks, best practices, and mobile-first thinking patterns.

## When to Use

- Building mobile applications (iOS, Android, or cross-platform)
- Implementing mobile-first design and UX patterns
- Optimizing for mobile constraints (battery, memory, network, small screens)
- Making native vs cross-platform technology decisions
- Implementing offline-first architecture and data sync
- Following platform-specific guidelines (iOS HIG, Material Design)
- Optimizing mobile app performance and user experience
- Implementing mobile security and authentication
- Testing mobile applications (unit, integration, E2E)
- Deploying to App Store and Google Play

## Technology Selection Guide

**Cross-Platform Frameworks:**
- **React Native**: JavaScript expertise, web code sharing, mature ecosystem (121K stars, 67% familiarity)
- **Flutter**: Performance-critical apps, complex animations, fastest-growing (170K stars, 46% adoption)

**Native Development:**
- **iOS (Swift/SwiftUI)**: Maximum iOS performance, latest features, Apple ecosystem integration
- **Android (Kotlin/Jetpack Compose)**: Maximum Android performance, Material Design 3, platform optimization

See: `references/mobile-frameworks.md` for detailed framework comparisons

## Mobile Development Mindset

**The 10 Commandments of Mobile Development:**

1. **Performance is Foundation, Not Feature** - 70% abandon apps >3s load time
2. **Every Kilobyte, Every Millisecond Matters** - Mobile constraints are real
3. **Offline-First by Default** - Network is unreliable, design for it
4. **User Context > Developer Environment** - Think real-world usage scenarios
5. **Platform Awareness Without Platform Lock-In** - Respect platform conventions
6. **Iterate, Don't Perfect** - Ship, measure, improve cycle is survival
7. **Security and Accessibility by Design** - Not afterthoughts
8. **Test on Real Devices** - Simulators lie about performance
9. **Architecture Scales with Complexity** - Don't over-engineer simple apps
10. **Continuous Learning is Survival** - Mobile landscape evolves rapidly

See: `references/mobile-mindset.md` for thinking patterns and decision frameworks

## Reference Navigation

**Core Technologies:**
- `mobile-frameworks.md` - React Native, Flutter, Swift, Kotlin, framework comparison matrices, when to use each
- `mobile-ios.md` - Swift 6, SwiftUI, iOS architecture patterns, HIG, App Store requirements, platform capabilities
- `mobile-android.md` - Kotlin, Jetpack Compose, Material Design 3, Play Store, Android-specific features

**Best Practices & Development Mindset:**
- `mobile-best-practices.md` - Mobile-first design, performance optimization, offline-first architecture, security, testing, accessibility, deployment, analytics
- `mobile-debugging.md` - Debugging tools, performance profiling, crash analysis, network debugging, platform-specific debugging
- `mobile-mindset.md` - Thinking patterns, decision frameworks, platform-specific thinking, common pitfalls, debugging strategies

## Key Best Practices (2024-2025)

**Performance Targets:**
- App launch: <2 seconds (70% abandon if >3s)
- Memory usage: <100MB for typical screens
- Network requests: Batch and cache aggressively
- Battery impact: Respect Doze Mode and background restrictions
- Animation: 60 FPS (16.67ms per frame)

**Architecture:**
- MVVM for small-medium apps (clean separation, testable)
- MVVM + Clean Architecture for large enterprise apps
- Offline-first with hybrid sync (push + pull)
- State management: Zustand (React Native), Riverpod 3 (Flutter), StateFlow (Android)

**Security (OWASP Mobile Top 10):**
- OAuth 2.0 + JWT + Biometrics for authentication
- Keychain (iOS) / KeyStore (Android) for sensitive data
- Certificate pinning for network security
- Never hardcode credentials or API keys
- Implement proper session management

**Testing Strategy:**
- Unit tests: 70%+ coverage for business logic
- Integration tests: Critical user flows
- E2E tests: Detox (React Native), Appium (cross-platform), XCUITest (iOS), Espresso (Android)
- Real device testing mandatory before release

**Deployment:**
- Fastlane for automation across platforms
- Staged rollouts: Internal → Closed → Open → Production
- Mandatory: iOS 17 SDK (2024), Android 15 API 35 (Aug 2025)
- CI/CD saves 20% development time

## Quick Decision Matrix

| Need | Choose |
|------|--------|
| JavaScript team, web code sharing | React Native |
| Performance-critical, complex animations | Flutter |
| Maximum iOS performance, latest features | Swift/SwiftUI native |
| Maximum Android performance, Material 3 | Kotlin/Compose native |
| Rapid prototyping | React Native + Expo |
| Desktop + mobile | Flutter |
| Enterprise with JavaScript skills | React Native |
| Startup with limited resources | Flutter or React Native |
| Gaming or heavy graphics | Native (Swift/Kotlin) or Unity |

## Framework Quick Comparison (2024-2025)

| Criterion | React Native | Flutter | Swift/SwiftUI | Kotlin/Compose |
|-----------|--------------|---------|---------------|----------------|
| **Stars** | 121K | 170K | N/A | N/A |
| **Adoption** | 35% | 46% | iOS only | Android only |
| **Performance** | 80-90% native | 85-95% native | 100% native | 100% native |
| **Dev Speed** | Fast (hot reload) | Very fast (hot reload) | Fast (Xcode Previews) | Fast (Live Edit) |
| **Learning Curve** | Easy (JavaScript) | Medium (Dart) | Medium (Swift) | Medium (Kotlin) |
| **UI Paradigm** | Component-based | Widget-based | Declarative | Declarative |
| **Community** | Huge (npm) | Growing | Apple ecosystem | Android ecosystem |
| **Best For** | JS teams, web sharing | Performance, animations | iOS-only apps | Android-only apps |

## Implementation Checklist

**Project Setup:**
- Choose framework → Initialize project → Configure dev environment → Setup version control → Configure CI/CD → Team standards

**Architecture:**
- Choose pattern (MVVM/Clean) → Setup folders → State management → Navigation → API layer → Error handling → Logging

**Core Features:**
- Authentication → Data persistence → API integration → Offline sync → Push notifications → Deep linking → Analytics

**UI/UX:**
- Design system → Platform guidelines → Accessibility → Responsive layouts → Dark mode → Localization → Animations

**Performance:**
- Image optimization → Lazy loading → Memory profiling → Network optimization → Battery testing → Launch time optimization

**Quality:**
- Unit tests (70%+) → Integration tests → E2E tests → Accessibility testing → Performance testing → Security audit

**Security:**
- Secure storage → Authentication flow → Network security → Input validation → Session management → Encryption

**Deployment:**
- App icons/splash → Screenshots → Store listings → Privacy policy → TestFlight/Internal testing → Staged rollout → Monitoring

## Platform-Specific Guidelines

**iOS (Human Interface Guidelines):**
- Native navigation patterns (tab bar, navigation bar)
- iOS design patterns (pull to refresh, swipe actions)
- San Francisco font, iOS color system
- Haptic feedback, 3D Touch/Haptic Touch
- Respect safe areas and notch

**Android (Material Design 3):**
- Material navigation (bottom nav, navigation drawer)
- Floating action buttons, material components
- Roboto font, Material You dynamic colors
- Touch feedback (ripple effects)
- Respect system bars and gestures

## Common Pitfalls to Avoid

1. **Testing only on simulators** - Real devices show true performance
2. **Ignoring platform conventions** - Users expect platform-specific patterns
3. **No offline handling** - Network failures will happen
4. **Poor memory management** - Leads to crashes and poor UX
5. **Hardcoded credentials** - Security vulnerability
6. **No accessibility** - Excludes 15%+ of users
7. **Premature optimization** - Optimize based on metrics, not assumptions
8. **Over-engineering** - Start simple, scale as needed
9. **Skipping real device testing** - Simulators don't show battery/network issues
10. **Not respecting battery** - Background processing must be justified

## Performance Budgets

**Recommended Targets:**
- **App size**: <50MB initial download, <200MB total
- **Launch time**: <2 seconds to interactive
- **Screen load**: <1 second for cached data
- **Network request**: <3 seconds for API calls
- **Memory**: <100MB for typical screens, <200MB peak
- **Battery**: <5% drain per hour of active use
- **Frame rate**: 60 FPS (16.67ms per frame)

## Resources

**Official Documentation:**
- React Native: https://reactnative.dev/
- Flutter: https://flutter.dev/
- iOS HIG: https://developer.apple.com/design/human-interface-guidelines/
- Material Design: https://m3.material.io/
- OWASP Mobile: https://owasp.org/www-project-mobile-top-10/

**Tools & Testing:**
- Detox E2E: https://wix.github.io/Detox/
- Appium: https://appium.io/
- Fastlane: https://fastlane.tools/
- Firebase: https://firebase.google.com/

**Community:**
- React Native Directory: https://reactnative.directory/
- Pub.dev (Flutter packages): https://pub.dev/
- Awesome React Native: https://github.com/jondot/awesome-react-native
- Awesome Flutter: https://github.com/Solido/awesome-flutter
