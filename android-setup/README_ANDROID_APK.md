# Building the Standalone Android APK for Sri Lankan Fishing Harbours (MIIS Sea Reporter)

This guide packages the offline-first MIIS React PWA into a standalone Android `.apk` using **Capacitor**, ready to distribute directly at Sri Lankan fishery harbours (Negombo, Chilaw, Kalpitiya, Beruwala, Galle, Mirissa, Trincomalee, Jaffna, Mannar) without requiring Google Play or constant internet access.

---

## 1. One-Time Setup (Requires Node.js 18+ & Android Studio / JDK 17)

```bash
# 1. Install Capacitor CLI & Android runtime + hardware GNSS/Network plugins
npm install @capacitor/core @capacitor/android @capacitor/geolocation @capacitor/network
npm install -D @capacitor/cli

# 2. Build the latest offline-first production web bundle (includes 516-record national QA dataset)
npm run build

# 3. Generate the native Android project using our pre-configured capacitor.config.json
npx cap add android
```

## 2. Configure Hardware GNSS & Offline Permissions

Open `android/app/src/main/AndroidManifest.xml` and merge the permissions from [AndroidManifest.permissions.xml](./AndroidManifest.permissions.xml):
- `ACCESS_FINE_LOCATION` + `android.hardware.location.gps` (enables direct GPS/GLONASS/Galileo hardware lock with **zero mobile signal**)
- `CAMERA` + `READ_MEDIA_IMAGES` (enables native camera capture with original EXIF GPS intact)
- `ACCESS_NETWORK_STATE` (detects 2G/offline sea signal vs. harbour 4G/Wi-Fi for two-phase photo deferral)
- `<queries>` SMS intent declaration (required on Android 11+ so the 1-tap `sms:` 2G beacon button launches the phone's SMS app cleanly)

## 3. Set Your Production MIIS Server Endpoint

In production harbour builds, point API requests to your deployed HTTPS MIIS server (e.g., University of Jaffna server / Railway / Fly.io / DigitalOcean):
- Add `VITE_API_BASE=https://miis.yourdomain.lk` or configure Capacitor `server.url` / reverse proxy.
- Set `MIIS_SMS_WEBHOOK_SECRET` in the server `.env` file before connecting an Android SMS Forwarder or SIM800L receiver.

## 4. Compile & Distribute the Harbour APK

```bash
# Sync web assets into Android project
npm run build && npx cap sync android

# Option A: Open in Android Studio to generate a signed release APK
npx cap open android

# Option B: Build a testable debug APK directly via Gradle
cd android && ./gradlew assembleDebug
# Output APK: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. Setting Up a Zero-Cost Sri Lanka 2G Offshore SMS Gateway

Fishers 10–30 km offshore often lose 3G/4G mobile data while retaining 1-bar 2G voice/SMS coverage on Dialog, Mobitel, or Hutch. You have **two zero-subscription Sri Lanka options** already wired into `server/sms_gateway.js`:

### Option A — Free Android SMS Forwarder Phone (Recommended for Pilot)
1. Place any spare Android handset with a local **Dialog / Mobitel SIM** at your lab or harbour office connected to Wi-Fi.
2. Install the open-source **SMS Forwarder** app and add a forwarding rule:
   - **Filter:** SMS body contains `MIIS1|`
   - **Target Webhook URL:** `https://<your-miis-server>/api/sms/webhook/android-forwarder`
   - **Header:** `X-MIIS-SMS-Secret: <your-secret>`
   - **JSON Body:** `{"from":"%from%","message":"%text%"}`
3. Update the recipient number in `src/utils/maritimeGeo.js` (`sms:+94...`) to that SIM's number.

### Option B — Local Raspberry Pi / PC + SIM800L GSM Modem (~Rs. 3,000 hardware)
1. Wire a SIM800L GSM module via USB-TTL adapter to your MIIS server machine.
2. Run:
   ```bash
   pip install pyserial
   python server/sim800l_serial_bridge.py --port COM4 --api http://localhost:5000
   ```
3. Incoming `MIIS1|...` SMS beacons are automatically decoded, reverse-geocoded to the exact Sri Lankan coastal district & maritime zone, plotted live on the MIIS Map, and cleared from SIM memory.
