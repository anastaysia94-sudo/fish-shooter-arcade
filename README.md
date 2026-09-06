# F.S.A. — Fish Shooter Arcade

**SmartPickShop Holdings · SV04 Launch-Today RC3**

![Captain Reef — F.S.A. key art](assets/captain-reef.jpg)

F.S.A. is a standalone owned fish-shooter arcade product with a playable **Reef Run** game, configurable owned-game experiments, exact telemetry, responsive cyberpunk/steampunk presentation, and installable PWA support.

## Launch boundary

This repository is **F.S.A.-only**. EGM4000 and Founder Console remain separate products/codebases. F.S.A. uses **virtual/non-cash credits only**. No real-money deposits, withdrawals, cash prizes, or gambling operation is enabled by this release.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080/`.

## GitHub Pages deployment

The release is fully uploaded. GitHub requires the repository owner to enable Pages once at the account/repository settings level; GitHub Apps cannot perform that administration call. Open **Settings → Pages**, choose **GitHub Actions** as the source, then run the **Deploy F.S.A. to GitHub Pages** workflow from the Actions tab. After that, later deployments can use the same workflow.

## Included

- Playable Canvas fish-shooter
- Local arcade profile
- Virtual-credit balance and shot costs
- Cannon levels 1–10
- Spawn/HP/reward/speed experiment controls
- Exact owned-game telemetry (`fsa.telemetry.v1`)
- Session results and achievements
- Telemetry JSON export
- Offline-capable PWA shell
- Responsive desktop/tablet/mobile layout
- Original F.S.A. targeting mark and Captain Reef key art
- Automated release validation on pushes and pull requests

## Safety / integrity

Third-party services are not modified or bypassed. Telemetry in this repository describes only the owned F.S.A. environment.
