import json

with open('package.json', 'r') as f:
    pkg = json.load(f)

pkg['scripts']['build'] = "npm run optimize:images && npm run build:css && npm run build:lucide && npm run build:assets"
pkg['scripts']['test'] = "vitest run"

with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)
