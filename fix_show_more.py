import re

with open('js/main.js', 'r') as f:
    content = f.read()

# Make sure we didn't mess up earlier
if "Events Page: Show More Pagination" in content:
    print("Already inserted")

js_code = """
function initializeEventPagination() {
  const eventCollections = document.querySelectorAll('.events-collection');
  eventCollections.forEach(collection => {
    const cards = Array.from(collection.children);
    if (cards.length > 3) {
      // Hide cards beyond the first 3
      for (let i = 3; i < cards.length; i++) {
        cards[i].style.display = 'none';
      }

      const showMoreBtn = document.createElement('button');
      showMoreBtn.className = 'mt-8 mx-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 transition-colors';
      showMoreBtn.textContent = 'Show More';
      
      const btnContainer = document.createElement('div');
      btnContainer.className = 'text-center w-full mt-6 mb-12 flex justify-center col-span-full';
      btnContainer.appendChild(showMoreBtn);
      
      collection.parentNode.insertBefore(btnContainer, collection.nextSibling);

      showMoreBtn.addEventListener('click', () => {
        for (let i = 3; i < cards.length; i++) {
          cards[i].style.display = '';
        }
        btnContainer.style.display = 'none';
        if (typeof window.AOS !== 'undefined') window.AOS.refresh();
      });
    }
  });
}
"""

content = content.replace('document.addEventListener(\'DOMContentLoaded\', () => {', js_code + '\ndocument.addEventListener(\'DOMContentLoaded\', () => {\n  initializeEventPagination();')

with open('js/main.js', 'w') as f:
    f.write(content)
