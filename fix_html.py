import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove hero logo
content = re.sub(
    r'<div class="hero-logo-circle">\s*<img src="data:image/png;base64,[^>]+>\s*</div>',
    '',
    content,
    flags=re.DOTALL
)

# Also let's extract the gallery images list to see what it is
match = re.search(r'const galleryImages = \[(.*?)\];', content, re.DOTALL)
if match:
    print("Found gallery images:")
    print(match.group(1))

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

