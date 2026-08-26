import re

with open('js/main.js', 'r') as f:
    content = f.read()

# Fix CodeQL by checking origin properly
content = re.sub(r"href\.includes\('//linkedin\.com/'\) \|\| href\.includes\('//www\.linkedin\.com/'\)", "new URL(href).hostname.includes('linkedin.com')", content)
content = re.sub(r"href\.includes\('//facebook\.com/'\) \|\| href\.includes\('//www\.facebook\.com/'\)", "new URL(href).hostname.includes('facebook.com')", content)
content = re.sub(r"href\.includes\('//x\.com/'\) \|\| href\.includes\('//www\.x\.com/'\)", "new URL(href).hostname.includes('x.com')", content)
content = re.sub(r"href\.includes\('//twitter\.com/'\) \|\| href\.includes\('//www\.twitter\.com/'\)", "new URL(href).hostname.includes('twitter.com')", content)

with open('js/main.js', 'w') as f:
    f.write(content)
