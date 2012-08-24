'use strict';

self.port.on('icon', function(details) {
  generateIcon(details.text);
});

function generateIcon(aOverlayText) {
  let img = document.getElementById('icon');
  let canvas = document.createElement('canvas');
  canvas.setAttribute("width", 16);
  canvas.setAttribute("height", 16);
  let ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  if (aOverlayText) {
    ctx.textBaseline = "top";
    ctx.textAlign = "center";
    ctx.font = "9px sans-serif";
    let height = 9;
    let y = canvas.height - height - 1;  // 1 = bottom padding
    ctx.fillStyle = "#000";
    ctx.strokeStyle = "#F5DEB3";
    ctx.lineWidth = 4;
    ctx.strokeText(aOverlayText, canvas.width / 2, y);
    ctx.fillText(aOverlayText, canvas.width / 2, y);
  }

  self.port.emit('icon', {icon: canvas.toDataURL("image/png")});
}