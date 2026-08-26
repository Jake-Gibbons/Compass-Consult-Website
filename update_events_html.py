import re

with open('pages/events.html', 'r') as f:
    content = f.read()

# Change active button from List to Grid
content = content.replace(
    '<button type="button" class="view-toggle-button is-active" data-events-view="list" aria-pressed="true">List</button>',
    '<button type="button" class="view-toggle-button" data-events-view="list" aria-pressed="false">List</button>'
)
content = content.replace(
    '<button type="button" class="view-toggle-button" data-events-view="grid" aria-pressed="false">Grid</button>',
    '<button type="button" class="view-toggle-button is-active" data-events-view="grid" aria-pressed="true">Grid</button>'
)

# Change root default view
content = content.replace(
    '<div id="events-view-root" data-events-view="list" class="space-y-12">',
    '<div id="events-view-root" data-events-view="grid" class="space-y-12">'
)

with open('pages/events.html', 'w') as f:
    f.write(content)
