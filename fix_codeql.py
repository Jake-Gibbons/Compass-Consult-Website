import re

with open('js/main.js', 'r') as f:
    content = f.read()

# Fix CodeQL incomplete URL sanitization
content = re.sub(r"href\.includes\('linkedin\.com'\)", "href.includes('//linkedin.com/') || href.includes('//www.linkedin.com/')", content)
content = re.sub(r"href\.includes\('facebook\.com'\)", "href.includes('//facebook.com/') || href.includes('//www.facebook.com/')", content)
content = re.sub(r"href\.includes\('x\.com'\)", "href.includes('//x.com/') || href.includes('//www.x.com/')", content)
content = re.sub(r"href\.includes\('twitter\.com'\)", "href.includes('//twitter.com/') || href.includes('//www.twitter.com/')", content)

with open('js/main.js', 'w') as f:
    f.write(content)
