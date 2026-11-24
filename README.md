# Threshold Atlas

Explore places, save your shortlist and book a viewing. These illustrative listings and visits use demonstration inventory.

[Install on Android](https://github.com/hamzabounibanedz/threshold-atlas/releases/latest) · [Build and emulator results](https://github.com/hamzabounibanedz/threshold-atlas/actions/workflows/android.yml)

![Scan to open the installation page](docs/install-qr.png)

Download the APK on the release page and open it on Android 7 or later. Android may ask you to allow this browser to install apps. The release also includes an Android App Bundle, SHA-256 checksums, and Android emulator screenshots and test output.

Choose **Explore demo** or sign in with `threshold@demo.mobile.invalid` and `StudioVisit!27`. Each installation gets an isolated demo workspace. Personal accounts use email confirmation. Use fictional details in the demonstration environment.

## Development and release

Open the repository in a cloud development environment with Node 24. Run `npm ci` and `npm run dev` for web development. Use **Actions → Android release → Run workflow** to compile the APK and AAB, install the APK on a hosted emulator, test the principal workflow and publish verified artifacts. Signing uses repository secrets ANDROID_KEYSTORE and ANDROID_KEYPASS. The app identifier is `app.hamzabounibanedz.threshold`.

The hosted API is [Supabase](https://chwwunmxjinxkfkxymrw.supabase.co). This app owns its `threshold` database schema and `threshold_workspace` REST RPC. To deploy to a fresh Supabase project, apply the two SQL files in backend in numerical order, enable email/password authentication, and replace the public project URL and publishable key in src/platform.js. Admin roles are assigned only by a database administrator. Demo permissions are confined to the individual installation.

The branded iOS project is included. On a macOS cloud runner, install dependencies, build the web bundle and run `npx cap sync ios`. Distribution requires an Apple development team, provisioning profile and signing certificate.

See [attribution](NOTICE.md) and the [upstream license](LICENSE).
