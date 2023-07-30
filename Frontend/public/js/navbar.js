const hamburger = document.getElementById('hamburger')
const navLinks = document.getElementById('nav_links');
const closePopup = document.getElementById('close_popup');
hamburger.addEventListener('click', e => {
  console.log('tet')
  nav_links.classList.add('show')
  hamburger.classList.add('hide')
})

closePopup.addEventListener('click', () => {
    nav_links.classList.remove('show');
    hamburger.classList.remove('hide')

})

// const hamburger = document.getElementById('hamburger_popup');
// const navLinks = document.getElementById('nav_links');

// hamburger.addEventListener('click', () => {
//   navLinks.classList.toggle('show');
// });

// // Add this event listener to hide the nav links when any of the links is clicked
// const navLinksItems = document.querySelectorAll('.nav_links li a');
// navLinksItems.forEach(link => {
//   link.addEventListener('click', () => {
//     navLinks.classList.remove('show');
//   });
// });