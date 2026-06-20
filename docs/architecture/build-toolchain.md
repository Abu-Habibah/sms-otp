# Architecture: Build Toolchain

**Last Updated:** 2026-06-08 (post 0.1.2 patch)
**Status:** Active

---

## Purpose

Single source of truth for the build-system versions that ship with SMS Monitor. Update this doc whenever a version is bumped so we never lose track of what we standardized on.

---

## Current Toolchain (as of 2026-06-08)

| Layer | Component | Version | Source File |
|---|---|---|---|
| Build orchestration | Gradle | **9.5.0** | `gradle/wrapper/gradle-wrapper.properties` |
| Build orchestration | Gradle wrapper | bundled with 9.5.0 | `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.jar` |
| Build DSL | Kotlin DSL (KTS) | matches Kotlin toolchain | `*.gradle.kts` |
| Android build | Android Gradle Plugin (AGP) | **9.2.1** | `build.gradle.kts` |
| Language | Kotlin | **2.3.9** | `build.gradle.kts` |
| Annotation processing | KSP (Kotlin Symbol Processing) | **2.3.9** | `build.gradle.kts` |
| Parcelize compiler plugin | `org.jetbrains.kotlin.plugin.parcelize` | **2.3.10** | `build.gradle.kts` (root) + `app/build.gradle.kts` |
| Dependency injection | Hilt | **2.59.2** | `build.gradle.kts` + `app/build.gradle.kts` |
| Target JDK (compileOptions) | Java | **17** | `app/build.gradle.kts` |
| JVM target (Kotlin) | `JvmTarget.JVM_17` | **17** | `app/build.gradle.kts` |
| Android compileSdk | 34 | 34 | `app/build.gradle.kts` |
| Android targetSdk | 34 | 34 | `app/build.gradle.kts` |
| Android minSdk | 26 (Android 8.0) | 26 | `app/build.gradle.kts` |

### Transitive versions worth knowing

- **AndroidX Core KTX** `1.12.0`
- **AppCompat** `1.6.1`
- **Material Components** `1.11.0`
- **ConstraintLayout** `2.1.4`
- **Lifecycle (viewmodel / runtime / process)** `2.7.0`
- **Activity / Fragment KTX** `1.8.2` / `1.6.2`
- **Room** `2.8.4` (runtime, ktx, compiler via KSP)
- **Hilt-Work** `1.3.0` (with `hilt-compiler` 1.3.0 via KSP)
- **WorkManager** `2.9.0`
- **Retrofit** `2.9.0` + Gson converter `2.9.0`
- **OkHttp** `4.12.0` (incl. logging interceptor)
- **Test:** JUnit `4.13.2`, kotlinx-coroutines-test `1.7.3`, MockK `1.13.9`, AndroidX Test ext-junit `1.1.5`, Espresso `3.5.1`

---

## Upgrade History

| Date | Change | Reason |
|---|---|---|
| 2026-06-05 | Initial toolchain pinned (Gradle 8.13, AGP 9.2.1, Kotlin 2.3.9, KSP 2.3.9, Hilt 2.59.2) | Project bootstrap |
| 2026-06-08 | **Gradle wrapper bumped 8.13 → 9.5.0** | Modernization; AGP 9.2.1 recommends Gradle 9.x |
| 2026-06-08 | **Removed deprecated `gradle.properties` flags** (`android.builtInKotlin=false`, `android.newDsl=false`) | AGP 9.0+ ships built-in Kotlin support; flags triggered deprecation warnings |
| 2026-06-08 | **Parcelize plugin pinned at 2.3.10** (was implicit before); switched `id("kotlin-parcelize")` → `id("org.jetbrains.kotlin.plugin.parcelize")` | Kotlin compiler is 2.3.9, but the parcelize plugin has a different release cadence — 2.3.9 is not published on the Gradle Plugin Portal. 2.3.10 is the closest available. The minor mismatch is safe. |
| 2026-06-08 | **Fixed broken `gms.tasks` listener chain in `SmsForwardWorker`** | `Operation.result` returns a `ListenableFuture`, not a `Task`; calling `addOnSuccessListener` / `addOnFailureListener` on it never resolved. Removed the listener calls — `enqueueUniqueWork` doesn't need them. |

---

## Compatibility Notes

### Gradle ↔ AGP
- AGP **9.x** requires Gradle **8.10+**; we are on **9.5.0** which is well within support.
- See [Android Gradle Plugin compatibility matrix](https://developer.android.com/build/releases/gradle-plugin) for details.

### Kotlin ↔ KSP
- The KSP plugin version **must match the Kotlin version** (major + minor). We pin both at `2.3.9` to satisfy this rule.
- If you bump Kotlin, bump KSP in lockstep.

### Kotlin ↔ Parcelize
- The `kotlin-parcelize` plugin has its **own release cadence** that does not always line up with the Kotlin compiler. Kotlin compiler `2.3.9` is published; parcelize plugin `2.3.9` is **not**. The closest match is `2.3.10`. A 1-version drift is generally safe because the parcelize plugin only ships annotation-processing infrastructure — the Kotlin compiler version is what actually compiles your code.
- If you bump Kotlin, check the [Gradle Plugin Portal](https://plugins.gradle.org/plugin/org.jetbrains.kotlin.plugin.parcelize) for the closest parcelize version. Do not assume the same version exists.

### Hilt ↔ Kotlin
- Hilt 2.59.x is compatible with Kotlin 2.3.x. If you bump Hilt, verify the [Hilt release notes](https://dagger.dev/hilt/) for Kotlin version requirements.

### Java
- We compile against **Java 17** source/target. The Gradle daemon must run on a JDK that can target 17 (JDK 17+ recommended).

---

## Upgrade Procedure

When you need to bump one of the versions above:

1. **Check compatibility** — Use the links in [Compatibility Notes](#compatibility-notes) above. Verify the new version's required Gradle / Kotlin / JDK floor is met.
2. **Bump the version in the source file** listed in [Current Toolchain](#current-toolchain-as-of-2026-06-08).
3. **Run a clean build** to confirm:
   ```bash
   ./gradlew clean assembleDebug
   ```
4. **Resolve any deprecation warnings** — AGP 9.x is strict about deprecated flags. Inspect `build/reports/problems/problems-report.html` for actionable warnings.
5. **Update this document**:
   - Change the version in the matrix.
   - Add a row to [Upgrade History](#upgrade-history).
   - Bump "Last Updated" at the top.
6. **Update [`CHANGELOG.md`](../../CHANGELOG.md)** with the bump under `[Unreleased]`.
7. **Update [`docs/sprints/backlog.md`](../sprints/backlog.md)** — add a task row (e.g. `F-SPx-Tx Toolchain Bump`) and mark it done.
8. **Commit** — Group the version bump, doc updates, and CHANGELOG into a single commit so the history is easy to audit.

---

## Related Documentation

- [System Overview](./system-overview.md) — High-level architecture
- [Sprint Backlog](../sprints/backlog.md) — Tracks toolchain bumps as sprint tasks
- [CHANGELOG.md](../../CHANGELOG.md) — Release-by-release changes
- [AGP / Gradle compatibility](https://developer.android.com/build/releases/gradle-plugin)
- [Kotlin / KSP version map](https://github.com/google/ksp/releases)
