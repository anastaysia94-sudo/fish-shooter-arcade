# Fish Shooter Arcade (F.S.A.)

Owned playable fish-shooter arcade product under SmartPickShop Holdings.

## Launch build

This repository contains the SV04 Launch-Today RC3 F.S.A. web/PWA build.

- Virtual/non-cash credits only.
- Exact telemetry for owned-game analytics.
- Separate product/codebase from EGM4000.
- Can stream signed-in telemetry to the SmartPickShop launch backend when served from the full ecosystem deployment.

## Run locally

Serve this directory over HTTP (do not rely on `file://` for PWA/service-worker behavior):

```bash
python3 -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

## Production

For the full authenticated/cloud deployment, use the SmartPickShop Holdings Launch-Today RC3 package and its Docker/Caddy backend. This standalone repository is the F.S.A. product surface.

## Boundary

This build uses virtual/non-cash credits. It does not enable real-money deposits, withdrawals, or cash wagering.
