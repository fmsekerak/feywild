const canvas = document.getElementById('bannerParticles');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

let particles = [];
const colors = ['#ffb3ff','#ff9cff','#ffffff','#ffe4ff'];

for(let i=0; i<80; i++){
  particles.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*3+1,
    dx: (Math.random()-0.5)/2,
    dy: (Math.random()-0.5)/2,
    opacity: Math.random() * 0.7 + 0.3,
    opacitySpeed: Math.random() * 0.02 + 0.01,
    colorIndex: Math.floor(Math.random()*colors.length),
    colorSpeed: Math.random()*0.02+0.01 // speed of color change
  });
}


function animate(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for(let p of particles){
    // Update opacity for twinkle
    p.opacity += p.opacitySpeed;
    if(p.opacity > 1 || p.opacity < 0.3) p.opacitySpeed *= -1;

    // Update color index for shimmer
    p.colorIndex += p.colorSpeed;
    if(p.colorIndex >= colors.length) p.colorIndex = 0;

    // Interpolate colors for smooth gradient shimmer
    const c1 = colors[Math.floor(p.colorIndex) % colors.length];
    const c2 = colors[(Math.floor(p.colorIndex)+1) % colors.length];
    const t = p.colorIndex - Math.floor(p.colorIndex); // blend factor

    function blendColors(a, b, t){
      const r = Math.round(parseInt(a.slice(1,3),16)*(1-t) + parseInt(b.slice(1,3),16)*t);
      const g = Math.round(parseInt(a.slice(3,5),16)*(1-t) + parseInt(b.slice(3,5),16)*t);
      const b_ = Math.round(parseInt(a.slice(5,7),16)*(1-t) + parseInt(b.slice(5,7),16)*t);
      return `rgba(${r},${g},${b_},${p.opacity})`;
    }

    // Draw particle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = blendColors(c1,c2,t);
    ctx.fill();

    // Move particle
    p.x += p.dx;
    p.y += p.dy;

    // Wrap around
    if(p.x > canvas.width) p.x = 0;
    if(p.x < 0) p.x = canvas.width;
    if(p.y > canvas.height) p.y = 0;
    if(p.y < 0) p.y = canvas.height;
  }


  requestAnimationFrame(animate);
}

animate();
window.addEventListener('resize', () => {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
});
