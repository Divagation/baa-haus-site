/**
 * baa.haus — Terminal Typing Animation
 */

// Configuration
const headerText = 'baa.haus';
const menuItems = ['music', 'development', 'blog', 'business', 'play', 'about'];
const normalTypingSpeed = 150; // milliseconds per character
const fastTypingSpeed = 30; // milliseconds per character when space is held
const startDelay = 500; // delay before typing starts
const enterDelay = 800; // delay after header before menu

// Get elements
const terminalText = document.getElementById('terminalText');
const terminalMenu = document.getElementById('terminalMenu');
const cursor = document.getElementById('cursor');

let currentIndex = 0;
let currentMenuItem = 0;
let currentMenuChar = 0;
let typingSpeed = normalTypingSpeed;
let isSpacePressed = false;

// Speed up typing when space is held
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !isSpacePressed) {
    isSpacePressed = true;
    typingSpeed = fastTypingSpeed;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    isSpacePressed = false;
    typingSpeed = normalTypingSpeed;
  }
});

// Type header
function typeHeader() {
  if (currentIndex < headerText.length) {
    terminalText.textContent += headerText.charAt(currentIndex);
    currentIndex++;
    setTimeout(typeHeader, typingSpeed);
  } else {
    // Header complete, prepare for menu
    setTimeout(startMenuTyping, enterDelay);
  }
}

// Start typing menu items
function startMenuTyping() {
  // Move cursor to menu area
  cursor.style.position = 'static';
  typeMenuItem();
}

// Type current menu item
function typeMenuItem() {
  if (currentMenuItem < menuItems.length) {
    const item = menuItems[currentMenuItem];

    if (currentMenuChar < item.length) {
      // Create link element if this is the first character
      if (currentMenuChar === 0) {
        const link = document.createElement('a');
        link.href = `${item}.html`;
        link.className = 'menu-link';
        link.id = `menu-${item}`;
        terminalMenu.appendChild(link);

        // Add click handler for shutdown animation
        link.addEventListener('click', handleNavigation);
      }

      // Type character
      const link = document.getElementById(`menu-${item}`);
      link.textContent += item.charAt(currentMenuChar);
      currentMenuChar++;
      setTimeout(typeMenuItem, typingSpeed);
    } else {
      // Move to next menu item
      currentMenuItem++;
      currentMenuChar = 0;
      setTimeout(typeMenuItem, typingSpeed * 2);
    }
  } else {
    // All menu items typed - cursor continues blinking
    cursor.style.animation = 'blink 1s step-end infinite';
  }
}

// Handle navigation with shutdown animation
function handleNavigation(e) {
  e.preventDefault();
  const targetUrl = e.target.href;

  // Add shutdown class to body
  document.body.classList.add('shutdown');

  // Navigate after animation completes
  setTimeout(() => {
    window.location.href = targetUrl;
  }, 1500);
}

// Start typing after delay
setTimeout(() => {
  typeHeader();
}, startDelay);
