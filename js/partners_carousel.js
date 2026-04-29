
const container = document.querySelector('#scrollContainer');

// 1. Triple the content so the 'tail' always has a 'head' following it
// This allows for a seamless loop in both directions
const initialContent = container.innerHTML;
container.innerHTML = initialContent + initialContent + initialContent;

let isDown = false;
let startX;
let currentTranslate = 0;

// Helper to get current X position accurately even while CSS animation is running
function getComputedTranslateX(obj) {
    const style = window.getComputedStyle(obj);
    const matrix = new WebKitCSSMatrix(style.transform);
    return matrix.m41;
}

const start = (e) => {
    isDown = true;
    container.classList.add('is-dragging');

    // Capture the exact pixel position where the animation was at the moment of touch
    const currentX = getComputedTranslateX(container);

    // Stop the CSS loop so it doesn't fight the user's hand
    container.style.animation = 'none';
    container.style.transform = `translateX(${currentX}px)`;

    // Set up coordinates for the move calculation
    startX = (e.pageX || e.touches[0].pageX) - container.offsetLeft;
    currentTranslate = currentX;
};

const move = (e) => {
    if (!isDown) return;

    // Prevent default scrolling on mobile so the carousel moves instead
    if (e.cancelable) e.preventDefault();

    const x = (e.pageX || (e.touches ? e.touches[0].pageX : 0)) - container.offsetLeft;
    const walk = (x - startX) * 1.2; // Drag sensitivity multiplier
    let newTransform = currentTranslate + walk;

    // The logic: 1/3 of the total width is one full set of items
    const setWidth = container.scrollWidth / 3;

    // --- THE TELEPORTATION LOGIC ---
    // IF swipe too far RIGHT (reaching the start of the list)
    if (newTransform > 0) {
        newTransform -= setWidth;
        currentTranslate -= setWidth;
        startX = x;
    }
    // IF swipe too far LEFT (reaching the end of the cloned list)
    else if (newTransform < -setWidth) {
        newTransform += setWidth;
        currentTranslate += setWidth;
        startX = x;
    }

    container.style.transform = `translateX(${newTransform}px)`;
};

const end = () => {
    if (!isDown) return;
    isDown = false;
    container.classList.remove('is-dragging');

    // Reset the CSS animation so it picks up where the user left it.
    // Make sure '40s' matches your CSS file speed!
    container.style.animation = 'scroll 40s linear infinite';
    container.style.transform = '';
};

// Desktop Event Listeners
container.addEventListener('mousedown', start);
window.addEventListener('mousemove', move);
window.addEventListener('mouseup', end);

// Mobile Event Listeners
container.addEventListener('touchstart', start, { passive: true });
window.addEventListener('touchmove', move, { passive: false });
window.addEventListener('touchend', end);

