# SMS Monitor - Project Plan

## Project Overview

**Project Name:** SMS Monitor
**Type:** Native Android Application (Kotlin)
**Core Functionality:** Monitor incoming SMS messages, filter by keywords, and forward matching messages to a backend endpoint.
**Target Users:** Developers building SMS verification systems, businesses needing SMS notifications, automation enthusiasts.

---

## Documentation Structure

**Features**
- [SMS Monitoring](./docs/features/sms-monitoring.md)
- [Keyword Configuration](./docs/features/keyword-configuration.md)
- [Backend Forwarding](./docs/features/backend-forwarding.md)
- [Forwarding Logs](./docs/features/forwarding-logs.md)
- [Settings Configuration](./docs/features/settings-configuration.md)

**Architecture**
- [System Overview](./docs/architecture/system-overview.md)
- [Build Toolchain](./docs/architecture/build-toolchain.md) — Gradle / AGP / Kotlin version matrix
- [Data Flow](./docs/architecture/data-flow.md)

**Project**
- [Backlog](./docs/sprints/backlog.md)
- [CHANGELOG](./CHANGELOG.md)
- [README](./README.md)

---

## Feature: SMS Monitoring

### Feature Definition

**Description:** Continuously listen for incoming SMS without foreground notification, extract sender and message content.

**Problem Solved:** Users need to passively capture SMS messages for forwarding or backup purposes without manual intervention.

**User Story:** As a system administrator, I want the app to silently monitor incoming SMS so that I can capture verification codes automatically.

### Scope

**In Scope:**
- BroadcastReceiver registration for SMS events
- Runtime permission handling (RECEIVE_SMS)
- Multi-part SMS reassembly
- Dual SIM support

**Out of Scope:**
- Outgoing SMS handling
- SMS deletion/modification
- Contact management

### Acceptance Criteria

- [ ] App registers BroadcastReceiver for `android.provider.Telephony.SMS_RECEIVED`
- [ ] Runtime permission requested on Android 6+
- [ ] Multi-part messages reassembled within 5-second window
- [ ] SMS_ID generated from sender+timestamp hash for deduplication

### E2E Flow: SMS Monitoring

```
[External/Carrier SMS]
        │
        ▼
[Android System - SMS_RECEIVED Intent]
        │
        ▼
[SmsBroadcastReceiver]
        │
        ▼
[Extract: sender, body, timestamp]
        │
        ▼
[Generate SMS_ID (SHA256 hash)]
        │
        ▼
[Keyword Matching Engine]
```

### QA/Test Scenarios

```gherkin
Scenario: Normal SMS received with matching keyword
  Given monitoring is enabled
  When SMS received with content "Your OTP is 123456"
  Then message is forwarded to configured endpoint

Scenario: SMS from blocked number
  Given monitoring is enabled
  When SMS received from system number
  Then message is silently ignored

Scenario: Multi-part SMS received
  Given monitoring is enabled
  When long SMS split into 3 parts arrives within 5 seconds
  Then all parts are reassembled into single message
```

---

## Feature: Keyword Configuration

### Feature Definition

**Description:** Allow users to manage a list of keywords for filtering incoming SMS.

**Problem Solved:** Users need to specify which keywords trigger message forwarding.

**User Story:** As a user, I want to add/remove keywords so that only relevant SMS are forwarded.

### Scope

**In Scope:**
- CRUD operations for keywords
- Match modes: EXACT, CONTAINS, REGEX
- Enable/disable individual keywords
- Maximum 100 keywords

**Out of Scope:**
- Import/export keyword lists
- Keyword suggestions
- Cloud sync of keywords

### Acceptance Criteria

- [ ] User can add keyword with match mode
- [ ] User can edit existing keyword
- [ ] User can delete keyword with swipe gesture
- [ ] User can toggle keyword enabled/disabled
- [ ] Keywords persisted in Room database

### E2E Flow: Keyword Configuration

```
[User Action: Add Keyword]
        │
        ▼
[KeywordsViewModel - AddKeywordCommand]
        │
        ▼
[KeywordService.Validate(keyword)]
        │
        ├── Valid ──▶ [KeywordRepository.Insert(keyword)]
        │                   │
        │                   ▼
        │              [Room: keywords table]
        │
        └── Invalid ──▶ [Show validation error]
```

---

## Feature: Backend Forwarding

### Feature Definition

**Description:** Forward matching SMS to configurable backend endpoint via HTTP POST/GET.

**Problem Solved:** Users need SMS data sent to their backend for processing.

**User Story:** As a developer, I want SMS forwarded to my API so that I can process verification codes in my system.

### Scope

**In Scope:**
- Configurable endpoint URL
- HTTP POST/GET methods
- Custom headers (Authorization, API keys)
- Retry with exponential backoff
- Background processing

**Out of Scope:**
- WebSocket connections
- Batch forwarding
- Real-time streaming

### Acceptance Criteria

- [ ] SMS forwarded within 5 seconds of receipt
- [ ] Retry up to 5 times on failure
- [ ] Exponential backoff: 1s, 2s, 4s, 8s, 16s
- [ ] Forwarded message includes: timestamp, sender, message, matchedKeyword, deviceId

### E2E Flow: Backend Forwarding

```
[SMS Received + Keyword Match]
        │
        ▼
[Save to pending_forwards table]
        │
        ▼
[Enqueue SmsForwardJob]
        │
        ▼
[JobRunner - Check constraints]
        │
        ├── Network available ──▶ [HTTP POST to endpoint]
        │                               │
        │                               ├── Success ──▶ [Move to logs, status=SUCCESS]
        │                               │
        │                               └── Failure ──▶ [Increment retry, reschedule]
        │
        └── Network unavailable ──▶ [Wait for connectivity, retry]
```

### Error Handling

| Error Condition | Handling Strategy | Fallback |
|-----------------|-------------------|----------|
| Network timeout | Retry with backoff | Queue for later |
| 4xx response | Log error, no retry | Alert user |
| 5xx response | Retry with backoff | Max 5 attempts |
| Invalid URL | Log error | Disable forwarding |

---

## Feature: Forwarding Logs

### Feature Definition

**Description:** Local history of all forwarded messages with status tracking.

**Problem Solved:** Users need to audit what messages were forwarded and troubleshoot issues.

**User Story:** As an admin, I want to view forwarding history so that I can verify messages were sent.

### Scope

**In Scope:**
- Chronological log display
- Status filtering (PENDING, SUCCESS, FAILED)
- Detail view with full message
- Auto-prune at 1000 entries

**Out of Scope:**
- Log export
- Log search
- Cloud backup of logs

### Acceptance Criteria

- [ ] Logs displayed newest first
- [ ] Filter by status works
- [ ] Tap opens detail view
- [ ] Oldest entries pruned when exceeding 1000

---

## Feature: Settings & Configuration

### Feature Definition

**Description:** Central hub for backend URL, API keys, and app behavior configuration.

**Problem Solved:** Users need to configure how and where messages are forwarded.

**User Story:** As a user, I want to configure the backend URL and API key so that messages reach my server.

### Scope

**In Scope:**
- Backend URL configuration
- HTTP method selection
- API key/token storage (encrypted)
- WiFi-only toggle
- Device alias

**Out of Scope:**
- Multiple endpoint configurations
- Scheduled forwarding times
- Custom header builder

### Acceptance Criteria

- [ ] Backend URL validated before save
- [ ] API key stored in EncryptedSharedPreferences
- [ ] Settings persist across app restarts
- [ ] WiFi-only toggle respected by WorkManager

---

## Sprint: Phase 1 - Core Functionality

**Sprint Duration:** 1 week
**Goal:** SMS monitoring and basic forwarding working end-to-end

### Sprint Backlog

| Item ID | Task | Description | Estimated Time | Priority |
|---------|------|-------------|----------------|----------|
| F-SP1-T1 | Project Setup | Create Kotlin Android project, add dependencies | 2 hours | P0 |
| F-SP1-T2 | SMS Receiver | Implement Android BroadcastReceiver | 4 hours | P0 |
| F-SP1-T3 | Database | Setup Room with Keyword/Log tables | 3 hours | P0 |
| F-SP1-T4 | Keyword Service | CRUD operations for keywords | 3 hours | P1 |
| F-SP1-T5 | Forwarding Service | Basic HTTP POST without retry | 4 hours | P0 |

### Definition of Done
- [ ] SMS received triggers keyword check
- [ ] Matching SMS forwarded to test endpoint
- [ ] Unit tests for keyword matching pass
- [ ] No crashes on permission denial

---

## Sprint: Phase 2 - Background Processing

**Sprint Duration:** 1 week
**Goal:** Reliable background forwarding with retry logic

### Sprint Backlog

| Item ID | Task | Description | Estimated Time | Priority |
|---------|------|-------------|----------------|----------|
| F-SP2-T1 | WorkManager | Background job setup | 4 hours | P0 |
| F-SP2-T2 | Retry Logic | Exponential backoff implementation | 3 hours | P0 |
| F-SP2-T3 | Forwarding Logs | Log success/failure history | 3 hours | P1 |
| F-SP2-T4 | Settings UI | Backend URL and API key input | 4 hours | P1 |

### Definition of Done
- [ ] App killed by system continues forwarding
- [ ] Network loss queues messages for retry
- [ ] Retry count tracked and limited to 5

---

## Sprint: Phase 3 - UI and Polish

**Sprint Duration:** 1 week
**Goal:** Complete UI and handle edge cases

### Sprint Backlog

| Item ID | Task | Description | Estimated Time | Priority |
|---------|------|-------------|----------------|----------|
| F-SP3-T1 | Keywords UI | RecyclerView with swipe-delete | 4 hours | P1 |
| F-SP3-T2 | Logs UI | Status filter, detail view | 3 hours | P1 |
| F-SP3-T3 | Error Handling | Permission denial UI, network errors | 4 hours | P1 |
| F-SP3-T4 | Security | ProGuard, certificate pinning | 3 hours | P2 |

---

## Technology Stack

This section evaluates ALL viable technology stacks for the SMS Monitor project. SMS monitoring requires **platform-specific native code** (BroadcastReceiver) regardless of framework choice. All options below can accomplish the core functionality.

---

### 1. Native Android (Kotlin) - MVVM with Jetpack (Selected)

**Language & Framework:**
- Kotlin 2.3.9 with Android SDK 34 (compileSdk/targetSdk 34, minSdk 26)
- Gradle 9.5.0 + Android Gradle Plugin 9.2.1 — see [Build Toolchain](docs/architecture/build-toolchain.md) for full version matrix
- Jetpack Compose for UI (modern) or XML layouts (traditional)
- MVVM architecture with ViewModel + LiveData/StateFlow

**SMS Monitoring Approach:**
- Requires custom BroadcastReceiver subclass in Kotlin/Java
- Registered in AndroidManifest.xml with `android.provider.Telephony.SMS_RECEIVED` permission
- Cannot be implemented in shared/Dart/JS code—always platform-specific

**Background Processing:**
- WorkManager 2.9.x for reliable background jobs (survives app death)
- Coroutines + Flow for async operations
- Foreground Service only if persistent notification required

**HTTP Client:**
- Retrofit 2.9.0 with OkHttp interceptors
- Kotlin Coroutines adapter for suspend functions

**Local Database:**
- Room 2.8.4 (SQLite abstraction with compile-time verification)
- Flow-based reactive queries

**Pros:**
- Best performance and smallest APK size
- Full access to Android APIs and platform features
- Excellent tooling (Android Studio, Kotlin debugger)
- Strong typing with Kotlin
- WorkManager is industry-standard for background tasks

**Cons:**
- Android-only; iOS requires separate codebase
- Steeper learning curve if new to Android/Kotlin

**Learning Curve for Android Developers:**
- Low. Kotlin is concise and familiar to Java developers.
- MVVM + Room + WorkManager is the standard Android stack.

**Estimated App Size:**
- Minimal APK: 3-5 MB
- With Compose UI: 8-12 MB

---

### 2. Flutter (Dart) - Cross-Platform

**Language & Framework:**
- Dart 3.x with Flutter 3.x
- StatefulWidget/StatelessWidget with BLoC or Riverpod state management

**SMS Monitoring Approach:**
- **NOT possible in pure Dart**—requires platform channels to native Kotlin/Swift code
- Must write BroadcastReceiver in Kotlin (Android) and call from Flutter via MethodChannel
- Package: `flutter_sms` (uses platform channels internally) or custom implementation
- iOS: CKSMSBridge for SMS retriever (but iOS SMS access is severely restricted)

**Background Processing:**
- WorkManager plugin (`workmanager` package) delegates to native WorkManager
- flutter_local_notifications for foreground service if needed
- Isolate for CPU-intensive Dart code

**HTTP Client:**
- Dio 5.x (full-featured HTTP client with interceptors)
- http package (simpler, lightweight)

**Local Database:**
- sqflite 2.3.x (SQLite wrapper)
- drift (formerly moor) - reactive SQLite with type-safe queries
- Hive (NoSQL, fast, good for simple key-value storage)

**Pros:**
- Single codebase for Android + iOS
- Excellent UI performance (Skia rendering engine)
- Hot reload dramatically speeds up development
- Rich ecosystem of packages

**Cons:**
- SMS monitoring still requires native platform code (not truly cross-platform for this feature)
- Larger app size due to Flutter engine
- Platform channels add complexity for SMS-specific features
- iOS SMS access is extremely limited (Apple restrictions)

**Learning Curve for Android Developers:**
- Medium. Dart is easy to learn but Flutter paradigm differs from Android Views.
- Platform channels require writing native code anyway.

**Estimated App Size:**
- Minimal APK: 8-12 MB (Flutter engine)
- With dependencies: 15-25 MB

---

### 3. React Native (JavaScript/TypeScript) - Cross-Platform

**Language & Framework:**
- TypeScript 5.x with React Native 0.74+
- Functional components with Hooks
- Redux, MobX, or Zustand for state management

**SMS Monitoring Approach:**
- **NOT possible in JS/TS**—requires native modules
- Must use native modules: `react-native-sms` (Android only, uses BroadcastReceiver) or custom native module
- iOS: No viable SMS interception method (Apple prohibits it)

**Background Processing:**
- `react-native-background-fetch` or `react-native-jobscheduler`
- HeadlessJS (limited, deprecated in new架构)
- Native background tasks via custom native module

**HTTP Client:**
- Axios 1.x (most popular)
- Fetch API (built-in, sufficient for simple use cases)

**Local Database:**
- AsyncStorage (simple key-value, no longer recommended for structured data)
- WatermelonDB (high-performance SQLite with sync)
- SQLite Expo / `expo-sqlite` (if using Expo)
- Realm (powerful but heavier)

**Pros:**
- True cross-platform for most features
- Large ecosystem and community
- JavaScript/TypeScript developers easily ramp up
- Hot reload during development

**Cons:**
- SMS monitoring is Android-only even within React Native
- iOS SMS interception is impossible (Apple policy)
- Bridge architecture introduces performance overhead
- Background processing on iOS is extremely limited
- Larger app size vs native

**Learning Curve for Android Developers:**
- Medium-High. Must learn React paradigm and RN components.
- Still need native code for SMS (platform channels).

**Estimated App Size:**
- Minimal APK: 12-18 MB
- With dependencies: 20-35 MB

---

### 4. Ionic/Capacitor (TypeScript) - Web-Based

**Language & Framework:**
- TypeScript with Angular 17+, React 18+, or Vue 3+
- Capacitor 5.x for native bridge to WebView
- HTML/CSS/JS UI rendered in WebView

**SMS Monitoring Approach:**
- **NOT possible in web code**—requires Capacitor plugins or custom native code
- `@capacitor-community/sms` plugin or custom native plugin via Capacitor
- Android: BroadcastReceiver in native Kotlin called through Capacitor bridge
- iOS: No SMS interception (Apple restrictions apply)

**Background Processing:**
- Capacitor Background Runner plugin (limited)
- Native WorkManager via custom plugin
- WebView-based polling (battery inefficient, not recommended)

**HTTP Client:**
- Angular HttpClient / Axios / Fetch (standard web approaches)

**Local Database:**
- Ionic Storage (wraps IndexedDB/SQLite)
- WatermelonDB via Capacitor
- Plain IndexedDB for simple data

**Pros:**
- Fastest development if team knows Angular/React/Vue
- Shared UI code across web and mobile
- Live reload in browser during development
- Access to web ecosystem

**Cons:**
- WebView performance overhead
- SMS monitoring still requires native Android code
- iOS SMS interception impossible
- Larger app size due to WebView + Capacitor overhead
- Less native feel compared to Flutter/RN

**Learning Curve for Android Developers:**
- Low if familiar with web frameworks.
- High if only experienced in native Android development.

**Estimated App Size:**
- Minimal APK: 15-25 MB (WebView + Capacitor overhead)
- With dependencies: 25-40 MB

---

### 5. Traditional Android (Java/Kotlin) - Non-MVVM

**Language & Framework:**
- Java 17+ or Kotlin with traditional Android patterns
- XML layouts with Activities/Fragments
- No Jetpack ViewModel (using older patterns like LiveData in Activity)

**SMS Monitoring Approach:**
- Same native BroadcastReceiver as option #1
- Permission handling via manual ActivityCompat.requestPermissions

**Background Processing:**
- IntentService (deprecated but still functional)
- AlarmManager with BroadcastReceiver for scheduled tasks
- JobScheduler (API 21+)

**HTTP Client:**
- Retrofit 2.9.0 with Callbacks (not suspend functions)
- OkHttp 4.x directly
- HttpURLConnection (built-in, no dependencies)

**Local Database:**
- SQLiteOpenHelper (raw SQLite, no Room)
- ORMLite / GreenDAO (ORM libraries)
- ContentProvider for data sharing

**Pros:**
- Maximum compatibility with old Android versions
- Smaller APK size (no Jetpack/Compose overhead)
- Full control over lifecycle
- Works well for simple apps

**Cons:**
- Boilerplate code (no ViewModel, no Room type safety)
- Harder to maintain and test
- Deprecated patterns (IntentService)
- No reactive data binding

**Learning Curve for Android Developers:**
- Low for experienced Android devs (familiar patterns)
- Higher complexity due to manual lifecycle management

**Estimated App Size:**
- Minimal APK: 2-4 MB
- With dependencies: 5-10 MB

---

### 6. C# .NET MAUI - Cross-Platform

**Language & Framework:**
- C# 12 with .NET 8
- MVVM pattern with CommunityToolkit.Mvvm
- XAML or Blazor Hybrid for UI

**SMS Monitoring Approach:**
- Plugin.SMS uses platform-specific implementations
- Android: BroadcastReceiver in native C# via .NET MAUI Android-specific code
- iOS: Limited to SMS Retriever API only

**Background Processing:**
- Shiny 2.5.7 (Jobs, Bluetooth, more)
- Microsoft.Extensions.Hosting for DI and background tasks

**HTTP Client:**
- Refit 7.0.0 (type-safe REST client with compile-time verification)
- HttpClient with Polly for resilience

**Local Database:**
- sqlite-net-pcl 1.8.116 (SQLite wrapper)
- Entity Framework Core (heavier but full ORM)

**Pros:**
- Single codebase for Android + iOS (+ Windows/macOS)
- Modern C# features (async/await, LINQ)
- Strong typing and IDE support (Visual Studio/Rider)
- Good for .NET teams

**Cons:**
- Largest app size among all options
- .NET MAUI still maturing (bug fixes ongoing)
- Limited native API access compared to Kotlin
- SMS plugin ecosystem smaller than native

**Learning Curve for Android Developers:**
- Medium. C# is familiar to Java/Kotlin developers.
- XAML differs from Android XML but is learnable.

**Estimated App Size:**
- Minimal APK: 15-20 MB (.NET runtime)
- With dependencies: 25-40 MB

---

## Technology Stack Comparison

### UI Performance Comparison

| Criteria | Native Kotlin | Flutter | React Native | Ionic/Capacitor | Traditional Java/Kotlin | .NET MAUI |
|----------|--------------|---------|--------------|-----------------|------------------------|-----------|
| **Platform** | Android only | Android + iOS | Android + iOS | Android + iOS (+ web) | Android only | Android + iOS (+ desktop) |
| **SMS Native Code Required** | Yes | Yes | Yes | Yes | Yes | Yes |
| **iOS SMS Monitoring** | N/A | Very Limited | Impossible | Impossible | N/A | Very Limited |
| **Background Processing** | WorkManager | WorkManager plugin | Limited | Limited | IntentService/JobScheduler | Shiny |
| **App Size (minimal)** | 3-5 MB | 8-12 MB | 12-18 MB | 15-25 MB | 2-4 MB | 15-20 MB |
| **UI Rendering Performance** | Best | Excellent (Skia) | Good | Moderate (WebView) | Best | Moderate |
| **Learning Curve (Android dev)** | Low | Medium | Medium-High | Low-High | Low | Medium |
| **Code Sharing** | None | UI + Logic | UI + Logic | UI + Logic (+ web) | None | UI + Logic |
| **Ecosystem Maturity** | Excellent | Good | Excellent | Good | Mature | Developing |
| **Debugging** | Excellent | Good | Good | Good | Good | Good |

---

### Background Processing Performance Comparison

For an SMS monitoring app, **background processing performance is more critical than UI performance**. The following table evaluates how each stack performs for the core SMS monitoring functionality.

| Criteria | Native Kotlin | Flutter | React Native | Ionic/Capacitor | .NET MAUI |
|----------|--------------|---------|--------------|-----------------|-----------|
| **SMS Interception Latency** | ~50ms (direct BroadcastReceiver) | ~80-100ms (platform channel overhead) | ~80-100ms (native module bridge) | ~100-150ms (Capacitor bridge) | ~100-150ms (plugin abstraction) |
| **Background Job Reliability** | Excellent (WorkManager) | Good (WorkManager plugin) | Moderate (HeadlessJS limited) | Limited (WebView-based) | Good (Shiny Jobs) |
| **Battery Efficiency** | Excellent (原生 API, Doze optimized) | Good (delegates to WorkManager) | Moderate (bridge overhead) | Poor (WebView polling) | Moderate (.NET runtime) |
| **Retry Mechanism** | WorkManager + custom (excellent) | WorkManager plugin + custom | Limited (JS-based, unreliable) | Web polling (inefficient) | Shiny Jobs + Polly (good) |
| **Network Operation Efficiency** | OkHttp/Retrofit (excellent) | Dio (good) | Axios/Fetch (good) | Fetch (moderate) | Refit/HttpClient (good) |
| **Survives App Kill** | Yes (WorkManager) | Yes (WorkManager) | Partial (unreliable) | No (WebView-based) | Yes (Shiny) |
| **Survives Device Restart** | Yes (with Boot receiver) | Yes (with boot receiver) | Limited | No | Yes (with boot receiver) |
| **Doze Mode Handling** | Excellent (WorkManager) | Good (WorkManager) | Poor (JS thread sleeps) | Not supported | Moderate |

**Background Processing Performance Summary:**

| Stack | Background Verdict |
|-------|-------------------|
| **Native Kotlin** | **BEST** - Direct API access, WorkManager is gold standard, minimal overhead, excellent battery efficiency |
| **Flutter** | **Good** - WorkManager plugin works, platform channel adds ~30-50ms latency, acceptable for most use cases |
| **React Native** | **Moderate** - Bridge architecture unreliable for background, HeadlessJS deprecated, JS thread can sleep |
| **Ionic/Capacitor** | **Poor** - WebView-based background processing, no true WorkManager integration, battery inefficient |
| **.NET MAUI** | **Moderate** - Shiny library helps but .NET runtime adds overhead, smaller ecosystem for background tasks |

---

### Which Stack is Best for SMS Monitoring Background Processing?

**Answer: Native Kotlin (with WorkManager)**

For SMS monitoring specifically, background processing performance matters more than UI smoothness because:

1. **SMS interception is time-critical**: Carriers may store OTP codes for only 30-60 seconds before expiry
2. **Reliability is paramount**: Messages must be forwarded even if the app was killed or device restarted
3. **Battery efficiency affects user experience**: Users won't keep an SMS monitoring app installed if it drains battery

Native Kotlin with WorkManager provides:
- **Lowest latency**: Direct BroadcastReceiver with no bridge overhead (~50ms vs 80-150ms)
- **Highest reliability**: WorkManager is designed by Google to survive app kills, device reboots, and Doze mode
- **Best battery efficiency**: WorkManager batches jobs intelligently and respects Doze mode
- **Industry proven**: Used by WhatsApp, Telegram, and all major SMS apps for background SMS handling

Cross-platform solutions add 30-100ms latency and reliability issues that may cause missed SMS in critical scenarios.

---

## Recommendations

### Best for SMS Monitoring Background Processing
**Native Android (Kotlin) with MVVM**
- Smallest latency (~50ms) for SMS interception
- WorkManager provides best reliability (survives app kill, device restart, Doze mode)
- Lowest battery impact due to native API access
- Recommended if SMS reliability is the primary concern

### Best for Cross-Platform (Android + iOS) with Single Codebase
**Flutter (Dart)**
- Acceptable SMS interception latency (~80-100ms with platform channels)
- WorkManager plugin provides good reliability
- Best cross-platform UI consistency
- iOS SMS is severely limited regardless of framework choice

### Best for Rapid Development
**Flutter (Dart)** or **Ionic/Capacitor**
- Flutter: Hot reload + rich widget library
- Ionic: Web developers can build mobile apps immediately
- Both require native code for SMS, but UI development is faster

### Best for Team with JavaScript Experience
**React Native (TypeScript)**
- JavaScript/TypeScript developers can contribute immediately
- Largest community and job market
- Caution: iOS SMS interception is impossible; Android-only feature on iOS means separate implementation

---

## Security Checklist

- [ ] API key stored encrypted (EncryptedSharedPreferences/SecureStorage)
- [ ] No logging of sensitive message content in production
- [ ] `android:allowBackup="false"` in manifest
- [ ] ProGuard/R8 obfuscation enabled for release
- [ ] Certificate pinning for backend calls

---

## API Contract

### POST /sms/forward

**Request:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "sender": "+1234567890",
  "message": "Your verification code is 123456",
  "matchedKeyword": "verification",
  "deviceId": "android-a1b2c3d4-e5f6-7890",
  "deviceAlias": "My Phone"
}
```

**Response (200):**
```json
{
  "success": true,
  "forwardId": "fwd_abc123"
}
```

---

## Status: Draft

**Next Steps:**
- [ ] Confirm technology stack choice
- [ ] Review and finalize feature scope
- [ ] Start Phase 1 implementation
