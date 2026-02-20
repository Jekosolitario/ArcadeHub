const scoreEl = document.querySelector("#scoreEl");
const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = window.innerWidth; // 1024
canvas.height = window.innerHeight; // 576

//========================CLASSE PLAYER================================
class Player {
  constructor() {
    this.velocity = {
      x: 0,
      y: 0,
    };

    this.rotation = 0;
    this.opacity = 1;
    const spaceship = new Image();
    spaceship.src = "./img/spaceship.png";
    spaceship.onload = () => {
      this.image = spaceship;
      this.width = spaceship.width * 0.15;
      this.height = spaceship.height * 0.15;
      this.position = {
        x: canvas.width / 2 - this.width / 2,
        y: canvas.height - this.height - 20,
      };
    };
  }

  draw() {
    // c.fillStyle = "red";
    // c.fillRect(this.position.x, this.position.y, this.width, this.height);
    c.save();
    c.globalAlpha = this.opacity;
    c.translate(
      player.position.x + player.width / 2,
      player.position.y + player.height / 2
    );
    c.rotate(this.rotation);
    c.translate(
      -player.position.x - player.width / 2,
      -player.position.y - player.height / 2
    );
    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
    c.restore();
  }
  update() {
    if (this.image) {
      this.draw();
      this.position.x += this.velocity.x;
    }
  }
}
//========================CLASSE PROJECTILE================================
class Projectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 4;
  }
  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = "red";
    c.fill();
    c.closePath();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}
//========================CLASSE INVADER PROJECTILE================================
class InvaderProjectile {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;

    this.width = 7;
    this.height = 14;
  }
  draw() {
    c.fillStyle = "white";
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}
//========================CLASSE INVADER================================
class Invader {
  constructor({ position }) {
    this.velocity = {
      x: 0,
      y: 0,
    };

    const invader = new Image();
    invader.src = "./img/invader.png";
    invader.onload = () => {
      this.image = invader;
      this.width = invader.width;
      this.height = invader.height;
      this.position = {
        x: position.x,
        y: position.y,
      };
    };
  }

  draw() {
    // c.fillStyle = "red";
    // c.fillRect(this.position.x, this.position.y, this.width, this.height);

    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }
  update({ velocity }) {
    if (this.image) {
      this.draw();
      this.position.x += velocity.x;
      this.position.y += velocity.y;
    }
  }
  shoot(invaderProjectiles) {
    if (this.image) {
      invaderProjectiles.push(
        new InvaderProjectile({
          position: {
            x: this.position.x + this.width / 2,
            y: this.position.y + this.height,
          },
          velocity: {
            x: 0,
            y: 5,
          },
        })
      );
    }
  }
}
//========================CLASSE GRID===================================
class Grid {
  constructor() {
    this.position = {
      x: 0,
      y: 0,
    };
    this.velocity = {
      x: 5,
      y: 0,
    };
    this.invaders = [];
    const columns = Math.floor(Math.random() * 10 + 5);
    const rows = Math.floor(Math.random() * 5 + 2);
    this.width = columns * 30;

    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        this.invaders.push(new Invader({ position: { x: i * 30, y: j * 30 } }));
      }
    }
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.velocity.y = 0;

    if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
      this.velocity.x = -this.velocity.x;
      this.velocity.y = 30;
    }
  }
}
//========================CLASSE PARTICLE================================
class Particle {
  constructor({ position, velocity, radius, color }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
  }
  draw() {
    c.save();
    c.globalAlpha = this.opacity;
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
    c.restore();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.opacity -= 0.01;
  }
}
//============================CREAZIONE==================================
const player = new Player();
const projectiles = [];
const grids = [];
const invaderProjectiles = [];
const particles = [];

const keys = {
  a: { pressed: false },
  d: { pressed: false }
};

let frames = 0;
let randomInterval = Math.floor(Math.random() * 500) + 500;
let score = 0;

// ========================== GAME STATE ==========================
let gameState = "start";
// "start" | "playing" | "gameover"

// ========================== UI SCREENS ==========================

function drawStartScreen() {
  c.fillStyle = "white";
  c.textAlign = "center";

  c.font = "60px 'Press Start 2P'";
  c.fillText("SPACE INVADERS", canvas.width / 2, canvas.height / 3);

  c.font = "30px 'Press Start 2P'";
  c.fillText("Press SPACE to Start", canvas.width / 2, canvas.height / 2);
}

function drawGameOverScreen() {
  c.fillStyle = "red";
  c.textAlign = "center";

  c.font = "60px 'Press Start 2P'";
  c.fillText("GAME OVER", canvas.width / 2, canvas.height / 3);

  c.fillStyle = "white";
  c.font = "30px 'Press Start 2P'";
  c.fillText("Press SPACE to Restart", canvas.width / 2, canvas.height / 2);
}

// ========================== RESET ==========================

function resetGame() {
  projectiles.length = 0;
  grids.length = 0;
  invaderProjectiles.length = 0;
  particles.length = 0;

  score = 0;
  scoreEl.innerHTML = score;

  player.opacity = 1;
  player.rotation = 0;
  player.velocity.x = 0;

  if (player.width) {
    player.position.x = canvas.width / 2 - player.width / 2;
  }

  frames = 0;
}

// ========================== ANIMATE ==========================

function animate() {
  requestAnimationFrame(animate);

  c.fillStyle = "black";
  c.fillRect(0, 0, canvas.width, canvas.height);

  // ===== START SCREEN =====
  if (gameState === "start") {
    drawStartScreen();
    return;
  }

  // ===== GAME OVER SCREEN =====
  if (gameState === "gameover") {
    drawGameOverScreen();
    return;
  }

  // ====== GIOCO ATTIVO ======

  // stelle
  for (let i = 0; i < 2; i++) {
    particles.push(
      new Particle({
        position: {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height
        },
        velocity: { x: 0, y: Math.random() * 3 },
        radius: Math.random() * 3,
        color: "orange"
      })
    );
  }

  player.update();

  particles.forEach((particle, index) => {
    if (particle.opacity <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  if (keys.a.pressed && player.position.x >= 0) {
    player.velocity.x = -5;
    player.rotation = -0.15;
  } else if (
    keys.d.pressed &&
    player.position.x <= canvas.width - player.width
  ) {
    player.velocity.x = 5;
    player.rotation = 0.15;
  } else {
    player.velocity.x = 0;
    player.rotation = 0;
  }

  // PROJECTILES
  projectiles.forEach((projectile, index) => {
    if (projectile.position.y + projectile.radius <= 0) {
      projectiles.splice(index, 1);
    } else {
      projectile.update();
    }
  });

  // ENEMY PROJECTILES
  invaderProjectiles.forEach((invaderProjectile, index) => {
    if (
      invaderProjectile.position.y + invaderProjectile.height >= canvas.height
    ) {
      invaderProjectiles.splice(index, 1);
    } else {
      invaderProjectile.update();
    }

    // collisione player
    if (
      invaderProjectile.position.y + invaderProjectile.height >= player.position.y &&
      invaderProjectile.position.x + invaderProjectile.width >= player.position.x &&
      invaderProjectile.position.x <= player.position.x + player.width
    ) {
      invaderProjectiles.splice(index, 1);
      player.opacity = 0;

      gameState = "gameover";
    }
  });

  // GRIDS
  grids.forEach((grid, indice) => {
    grid.update();

    if (frames % 100 === 0 && grid.invaders.length > 0) {
      grid.invaders[
        Math.floor(Math.random() * grid.invaders.length)
      ].shoot(invaderProjectiles);
    }

    grid.invaders.forEach((invader, i) => {
      invader.update(grid);

      projectiles.forEach((projectile, index) => {
        if (
          projectile.position.y - projectile.radius <=
            invader.position.y + invader.height &&
          projectile.position.x + projectile.radius >= invader.position.x &&
          projectile.position.x - projectile.radius <=
            invader.position.x + invader.width &&
          projectile.position.y + projectile.radius >= invader.position.y
        ) {
          score += 100;
          scoreEl.innerHTML = score;

          grid.invaders.splice(i, 1);
          projectiles.splice(index, 1);

          if (grid.invaders.length === 0) {
            grids.splice(indice, 1);
          }
        }
      });
    });
  });

  // SPAWN ENEMY
  if (frames % randomInterval === 0) {
    grids.push(new Grid());
    randomInterval = Math.floor(Math.random() * 500) + 500;
    frames = 0;
  }

  frames++;
}

animate();

// ========================== CONTROLLI ==========================

addEventListener("keydown", ({ key }) => {
  if (gameState !== "playing") return;

  switch (key) {
    case "a":
      keys.a.pressed = true;
      break;
    case "d":
      keys.d.pressed = true;
      break;
  }
});

addEventListener("keyup", ({ key }) => {
  if (key === " ") {
    if (gameState === "start") {
      gameState = "playing";
      return;
    }

    if (gameState === "gameover") {
      resetGame();
      gameState = "playing";
      return;
    }

    if (gameState === "playing") {
      projectiles.push(
        new Projectile({
          position: {
            x: player.position.x + player.width / 2,
            y: player.position.y
          },
          velocity: { x: 0, y: -10 }
        })
      );
    }
  }

  if (gameState !== "playing") return;

  switch (key) {
    case "a":
      keys.a.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      break;
  }
});