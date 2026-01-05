const bannerImg = new Image();
bannerImg.src = '../images/banner.jpg'; // make sure path is correct

function animate() {
  // Draw banner image first
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

    p.x += p.dx;
    p.y += p.dy;

    p.opacity += p.opacitySpeed;
    if(p.opacity > 1 || p.opacity < 0.3) p.opacitySpeed *= -1;

    if(p.x > canvas.width) p.x = 0;
    if(p.x < 0) p.x = canvas.width;
    if(p.y > canvas.height) p.y = 0;
    if(p.y < 0) p.y = canvas.height;
  }

  requestAnimationFrame(animate);
}
