# F.S.A. — Fish Shooter Arcade

**SmartPickShop Holdings · SV04 Launch-Today RC3**

F.S.A. is a standalone owned fish-shooter arcade product with a playable **Reef Run** game, configurable owned-game experiments, exact telemetry, responsive cyberpunk/steampunk presentation, and installable PWA support.

## Launch boundary

This repository is **F.S.A.-only**. EGM4000 and Founder Console remain separate products/codebases. F.S.A. uses **virtual/non-cash credits only**. No real-money deposits, withdrawals, cash prizes, or gambling operation is enabled by this release.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080/`.

## Deploy

The included GitHub Pages workflow publishes the static PWA from `main`. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the source if it is not already enabled.

## Included

- Playable Canvas fish-shooter
- Local arcade profile
- Virtual-credit balance and shot costs
- Cannon levels 1–10
- Spawn/HP/reward/speed experiment controls
- Exact owned-game telemetry
- Session results and achievements
- Offline-capable PWA shell
- Responsive desktop/tablet/mobile layout

## Safety / integrity

Third-party services are not modified or bypassed. Telemetry in this repository describes only the owned F.S.A. environment.
