const canvas = document.getElementById('bannerParticles');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let particles = [];

for(let i=0; i<80; i++){
  particles.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*3+1,
    dx: (Math.random()-0.5)/2,
    dy: (Math.random()-0.5)/2,
    opacity: Math.random() * 0.7 + 0.3,
    opacitySpeed: Math.random() * 0.02 + 0.01,
    color: ['#ffb3ff','#ff9cff','#ffffff','#ffe4ff'][Math.floor(Math.random()*4)]
  });
}

function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(let p of particles){
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,182,255,0.7)';
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;

    // wrap around
    if(p.x > canvas.width) p.x = 0;
    if(p.x < 0) p.x = canvas.width;
    if(p.y > canvas.height) p.y = 0;
    if(p.y < 0) p.y = canvas.height;
  }

    // inside animate loop, after moving particle
    p.opacity += p.opacitySpeed;
    if(p.opacity > 1 || p.opacity < 0.3) p.opacitySpeed *= -1;
    ctx.fillStyle = `rgba(255,182,255,${p.opacity})`;

  requestAnimationFrame(animate);
}

animate();
window.addEventListener('resize', () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
});
