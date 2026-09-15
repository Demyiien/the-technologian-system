const sidebar = document.getElementById('sidebar');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobileOverlay = document.getElementById('mobileOverlay');

// Toggle mobile menu
function toggleMobileMenu(open) {
  const shouldOpen = open ?? !sidebar.classList.contains('is-open');
  sidebar.classList.toggle('is-open', shouldOpen);
  mobileOverlay.classList.toggle('is-open', shouldOpen);
  mobileMenuToggle.setAttribute('aria-expanded', String(shouldOpen));
}

mobileMenuToggle.addEventListener('click', () => toggleMobileMenu());
mobileOverlay.addEventListener('click', () => toggleMobileMenu(false));

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach((l) => l.classList.remove('is-active'));
    link.classList.add('is-active');
    toggleMobileMenu(false);
  });
});

// User profile dropdown
const userProfile = document.getElementById('userProfile');
const userTrigger = userProfile.querySelector('.user-profile-trigger');
const userDropdown = userProfile.querySelector('.user-dropdown');

userTrigger.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = userDropdown.classList.toggle('is-open');
  userTrigger.setAttribute('aria-expanded', String(isOpen));
});

document.addEventListener('click', (e) => {
  if (!userProfile.contains(e.target)) {
    userDropdown.classList.remove('is-open');
    userTrigger.setAttribute('aria-expanded', 'false');
  }
});
