# Android Local Build Workflow

This workflow builds the Karakeep Android APK entirely within GitHub Actions without relying on EAS cloud services. It uses the Android SDK and Gradle to compile the native APK locally.

## How It Works

1. **Checkout** the repository (including submodules if any)
2. **Setup Node.js 24** with pnpm via corepack
3. **Install dependencies** with `pnpm install`
4. **Setup Java 17** (required by Android build tools)
5. **Setup Android SDK**:
   - Android SDK Platform 35 (target SDK)
   - Android NDK 27.1.12297006 (as specified in app.config.js)
   - Android Build Tools
   - Command-line tools
6. **Expo prebuild** - Generates native Android project from Expo config
7. **Gradle assemble** - Builds the APK using `./gradlew`
8. **Upload artifact** - APK available for 30 days in Actions tab
9. **GitHub Release** (tagged pushes only) - Auto-attaches APK to release

## Triggers

### Tag-based Release Builds
Push a tag matching `android/v*.*.*` (e.g., `android/v1.9.2-1`):
```bash
git tag android/v1.0.0
git push origin android/v1.0.0
```

This builds a **release** APK and automatically creates a GitHub Release with the APK attached.

### Manual Workflow Dispatch
Go to **Actions → Android Build (Local) → Run workflow** and choose:
- **debug** - Debug variant (faster, for testing)
- **release** - Release variant (optimized, for distribution)

## Prerequisites

No external services needed! Everything builds in GitHub's Ubuntu runners.

The only requirement is that your repository must be public or you must have a paid GitHub account with sufficient minutes (Android builds typically take 15-25 minutes).

## Build Output

- **Artifacts** (30-day retention): `karakeep-android-debug` or `karakeep-android-release`
- **GitHub Releases** (tagged builds only): APK automatically attached

## Important Notes

### Debug vs Release Variants

- **Debug APK**: Can be sideloaded directly. Uses debug keystore (not suitable for Play Store).
- **Release APK**: Requires proper signing. The current setup uses the default debug keystore unless you configure custom keystore in EAS or provide `android/app/release.keystore`.

To sign the release APK properly for production distribution:

1. Generate a keystore:
```bash
keytool -genkeypair -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Add the keystore as a GitHub repository secret (e.g., `ANDROID_KEYSTORE_BASE64`).

3. Update the workflow to:
   - Decode the keystore from base64
   - Place it in `android/app/release.keystore`
   - Configure `gradle.properties` with keystore credentials

See the **Signing the Release APK** section below.

### Build Time

- First build: ~20-30 minutes (downloading dependencies, building native modules)
- Subsequent builds: ~15-20 minutes (due to Gradle and pnpm caching)

### Troubleshooting

**Gradle daemon issues**: The workflow uses `--no-daemon` to avoid daemon persistence issues in CI.

**Memory errors**: GitHub runners have 7GB RAM. If builds fail with OOM, the current configuration should handle it, but if issues persist, consider reducing parallel build jobs by adding `-Dorg.gradle.parallel=false` to the Gradle command.

**Missing NDK**: The workflow explicitly installs NDK 27.1.12297006 which matches the `expo-build-properties` plugin config.

## Customization

### Change Build Variants

Edit the `Build APK with Gradle` step to add additional Gradle arguments or build types.

### Add Version Code/Name from Git

You can dynamically set versionCode and versionName from git tags or commit count by modifying `android/app/build.gradle`. The current setup uses static version from `app.config.js`.

### Enable ProGuard/R8

Release builds already use ProGuard rules from the project. To customize, edit `android/app/proguard-rules.pro`.

## Signing the Release APK

For production distribution (outside debug), you should sign the APK with your own keystore.

### Option 1: Manual Keystore in Repository (Not Recommended)

1. Place your `release.keystore` in `apps/mobile/android/app/`
2. Configure signing in `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword System.getenv('KEYSTORE_PASSWORD')
            keyAlias 'my-key-alias'
            keyPassword System.getenv('KEY_PASSWORD')
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Add GitHub secrets: `KEYSTORE_PASSWORD` and `KEY_PASSWORD`

### Option 2: Keystore as Base64 Secret (Recommended)

Keep keystore out of repo:

1. Encode your keystore:
```bash
base64 my-release-key.keystore | tee keystore-base64.txt
```

2. Add secret `ANDROID_KEYSTORE_BASE64` with the base64 string.

3. Update the workflow:
```yaml
- name: Decode keystore
  run: |
    echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > apps/mobile/android/app/release.keystore
```

4. Continue with Option 1's gradle.properties setup.

## Advanced: Build Multiple ABIs

By default, Expo builds a universal APK. To build architecture-specific APKs:

1. Edit `android/app/build.gradle`:
```gradle
splits {
    abi {
        enable true
        reset()
        include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        universalApk false
    }
}
```

2. The workflow will then produce multiple APKs in `outputs/apk/<variant>/`.

## References

- [Expo Prebuild Documentation](https://docs.expo.dev/development/prebuild/)
- [Android Gradle Plugin](https://developer.android.com/studio/build)
- [Signing Your App](https://developer.android.com/studio/publish/app-signing)
