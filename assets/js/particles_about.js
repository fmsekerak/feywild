const canvas = document.getElementById('particlesCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Create particles
let particles = [];
const colors = ['#ffb3ff','#ff9cff','#ffffff','#ffe4ff'];

for(let i=0;i<150;i++){
  particles.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*3+1,
    dx: (Math.random()-0.5)*(Math.random()*1),
    dy: (Math.random()-0.5)*(Math.random()*1),
    opacity: Math.random()*0.7+0.3,
    opacitySpeed: Math.random()*0.02+0.01,
    color: colors[Math.floor(Math.random()*colors.length)]
  });
}

// Animate particles
function animate() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let p of particles){
    // Glow
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(${parseInt(p.color.slice(1,3),16)},${parseInt(p.color.slice(3,5),16)},${parseInt(p.color.slice(5,7),16)},${p.opacity})`;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Move
    p.x += p.dx;
    p.y += p.dy;

    // Wrap around edges
    if(p.x > canvas.width) p.x = 0;
    if(p.x < 0) p.x = canvas.width;
    if(p.y > canvas.height) p.y = 0;
    if(p.y < 0) p.y = canvas.height;

    // Twinkle
    p.opacity += p.opacitySpeed;
    if(p.opacity > 1 || p.opacity < 0.3) p.opacitySpeed *= -1;

    // Optional sparkle burst
    if(Math.random()<0.002){
      p.r *= 1.5;
      p.opacity = 1;
    }
  }

  requestAnimationFrame(animate);
}

animate();
