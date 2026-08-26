import re

with open('js/main.js', 'r') as f:
    content = f.read()

# Make sure we check exact hostname ending
content = re.sub(r"new URL\(href\)\.hostname\.includes\('([^']+)'\)", r"(new URL(href).hostname === '\1' || new URL(href).hostname.endsWith('.\1'))", content)

with open('js/main.js', 'w') as f:
    f.write(content)
