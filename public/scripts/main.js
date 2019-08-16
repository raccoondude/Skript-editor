var x = new Audio('https://cdn.glitch.com/cbbe5c66-fe51-47a6-bbe2-3980fcee7aef%2FPurring-SoundBible.com-1561515931.mp3?v=1565788847609');

document.getElementById("cat").onclick = function() {
  x.play();
  navigator.vibrate(500);
  console.log(1)
}