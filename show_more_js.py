import re

js_code = """
  // ---------------------------------------------------------------------------
  // Events Page: Show More Pagination
  // ---------------------------------------------------------------------------
  const eventCollections = document.querySelectorAll('.events-collection');
  eventCollections.forEach(collection => {
    const cards = Array.from(collection.querySelectorAll('.event-card, .col-span-full'));
    if (cards.length > 3) {
      // Hide cards beyond the first 3
      for (let i = 3; i < cards.length; i++) {
        cards[i].style.display = 'none';
      }

      const showMoreBtn = document.createElement('button');
      showMoreBtn.className = 'mt-8 mx-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-compass-teal hover:bg-compass-teal-dark transition-colors';
      showMoreBtn.textContent = 'Show More';
      
      const btnContainer = document.createElement('div');
      btnContainer.className = 'text-center w-full mt-6 mb-12 flex justify-center col-span-full';
      btnContainer.appendChild(showMoreBtn);
      
      // Insert after the collection
      collection.parentNode.insertBefore(btnContainer, collection.nextSibling);

      showMoreBtn.addEventListener('click', () => {
        // Show remaining
        for (let i = 3; i < cards.length; i++) {
          cards[i].style.display = '';
        }
        btnContainer.style.display = 'none'; // hide the button after expanding
        // Trigger AOS refresh if used
        if (typeof AOS !== 'undefined') AOS.refresh();
      });
    }
  });
"""

with open('js/main.js', 'r') as f:
    content = f.read()

# insert at the bottom of the DOMContentLoaded block
content = content.replace('// Initialize form handling', js_code + '\n  // Initialize form handling')

with open('js/main.js', 'w') as f:
    f.write(content)
