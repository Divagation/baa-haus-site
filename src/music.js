/**
 * baa.haus — Music Page Typing Animation
 */

// Configuration
const headerText = 'listen away!';
const menuItems = ['apple music', 'bandcamp', 'ko-fi'];
const normalTypingSpeed = 150; // milliseconds per character
const fastTypingSpeed = 30; // milliseconds per character when space is held
const startDelay = 500; // delay before typing starts
const enterDelay = 800; // delay after header before menu

// Get elements
const musicText = document.getElementById('musicText');
const musicMenu = document.getElementById('musicMenu');
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
    musicText.textContent += headerText.charAt(currentIndex);
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
        link.href = `#${item.replace(/\s+/g, '-')}`;
        link.className = 'menu-link';
        link.id = `menu-${item.replace(/\s+/g, '-')}`;
        musicMenu.appendChild(link);
      }

      // Type character
      const link = document.getElementById(`menu-${item.replace(/\s+/g, '-')}`);
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

// Start typing after delay
setTimeout(() => {
  typeHeader();
}, startDelay);
