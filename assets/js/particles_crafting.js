const canvas = document.getElementById('bannerParticles');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particle setup
let particles = [];
const colors = ['#ffb3ff','#ff9cff','#ffffff','#ffe4ff'];
const particleCount = 120;

for(let i=0;i<particleCount;i++){
  particles.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*3+1.5,          // particle radius
    dx: (Math.random()-0.5)*0.5,
    dy: (Math.random()-0.5)*0.5,
    opacity: Math.random()*0.7+0.3,
    opacitySpeed: Math.random()*0.05+0.02,
    color: colors[Math.floor(Math.random()*colors.length)]
  });
}

// Draw a glowing orb using radial gradient
function drawParticle(p){
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
  grad.addColorStop(0, `rgba(255,255,255,${p.opacity})`);  // center white
  grad.addColorStop(0.3, `${p.color}${Math.floor(p.opacity*255).toString(16)}`); // near edge color
  grad.addColorStop(1, 'rgba(0,0,0,0)');                  // fade out
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
  ctx.fill();
}

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let p of particles){
    // Update opacity for twinkle
    p.opacity += p.opacitySpeed;
    if(p.opacity > 1 || p.opacity < 0.2) p.opacitySpeed *= -1;

    // Draw glowing orb
    drawParticle(p);

    // Move particle
    p.x += p.dx;
    p.y += p.dy;

    // Wrap edges
    if(p.x > canvas.width) p.x = 0;
    if(p.x < 0) p.x = canvas.width;
    if(p.y > canvas.height) p.y = 0;
    if(p.y < 0) p.y = canvas.height;
  }

  requestAnimationFrame(animate);
}

animate();
