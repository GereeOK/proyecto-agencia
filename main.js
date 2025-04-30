const hero = document.querySelector('.hero');
const slides = [
'./img/avion.png',
'./img/buenosaires1.jpg',
'./img/buenosaires2.jpg',
'./img/tango.jpg' ];
let current = 0;
function nextSlide() {
hero.style.backgroundImage = `url(${slides[current]})`;
current = (current + 1) % slides.length;
}

// Arranca inmediatamente y luego cada 5 s
nextSlide();
setInterval(nextSlide, 5000);


