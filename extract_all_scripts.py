import re
import os

files_with_scripts = [
    'pages/contact.html',
    'pages/events.html',
    'pages/resources.html'
]

for file in files_with_scripts:
    with open(file, 'r') as f:
        content = f.read()

    pattern = re.compile(r'<script>(.*?)</script>\s*</body>', re.DOTALL)
    match = pattern.search(content)

    if match:
        script_content = match.group(1)
        name = os.path.basename(file).replace('.html', '.js')
        js_path = f"js/{name}"
        
        with open(js_path, 'w') as f:
            f.write(script_content)

        # Replace in HTML
        content = content[:match.start()] + f'<script src="/js/{name}"></script>' + content[match.end():]

        with open(file, 'w') as f:
            f.write(content)

