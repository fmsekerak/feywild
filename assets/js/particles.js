const canvas = document.getElementById('bannerParticles');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Create particles
let particles = [];
for(let i = 0; i < 120; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    dx: (Math.random() - 0.5) / 2,
    dy: (Math.random() - 0.5) / 2,
    opacity: Math.random() * 0.7 + 0.3,
    opacitySpeed: Math.random() * 0.02 + 0.01,
    color: ['#ffb3ff','#ff9cff','#ffffff','#ffe4ff'][Math.floor(Math.random()*4)]
  });
}

// Load banner image first
const bannerImg = new Image();
bannerImg.src = '../images/banner.jpg'; // make sure the path is correct

bannerImg.onload = () => {
  // Start animation only after image has loaded
  animate();
};

function animate() {
  // Draw banner image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bannerImg, 0, 0, canvas.width, canvas.height);

  // Draw semi-transparent overlay for trails
  ctx.fillStyle = 'rgba(26,26,29,0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw particles
  for(let p of particles){
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${parseInt(p.color.slice(1,3),16)}, ${parseInt(p.color.slice(3,5),16)}, ${parseInt(p.color.slice(5,7),16)}, ${p.opacity})`;
    ctx.fill();

    // Move
    p.x += p.dx;
    p.y += p.dy;

    // Twinkle effect
    p.opacity += p.opacitySpeed;
    if(p.opacity > 1 || p.opacity < 0.3) p.opacitySpeed *= -1;

    // Wrap around edges
    if(p.x > canvas.width) p.x = 0;
    if(p.x < 0) p.x = canvas.width;
    if(p.y > canvas.height) p.y = 0;
    if(p.y < 0) p.y = canvas.height;
  }

  requestAnimationFrame(animate);
}
