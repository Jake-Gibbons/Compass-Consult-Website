import re

with open('js/main.js', 'r') as f:
    content = f.read()

content = content.replace('payload && payload.error ? payload.error', 'payload && payload.message ? payload.message')

with open('js/main.js', 'w') as f:
    f.write(content)
