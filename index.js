document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.grid');
  const doodler = document.createElement('div');
  let lives = 3;
  let score = 0;
  let isGameOver = false;
  let platforms = [];
  let platformCount = 5;
  let doodlerLeftSpace = 50;
  let doodlerBottomSpace = 150;
  let startPoint = doodlerBottomSpace;
  let upTimerId;
  let downTimerId;
  let isJumping = true;
  let isGoingLeft = false;
  let isGoingRight = false;
  let gameObjects = [];
  let projectiles = [];
  let isMagnetActive = false;
  let magnetTimerId;
  let isRocketActive = false;
  let rocketTimerId;
  let gameSpeed = 4;
  let projectileSpeed = 5;
  let platformMoveSpeed = 1;
  let difficultyLevel = 1;
  const difficultyThreshold = 1000;

  const mainMenuScreen = document.getElementById('main-menu');
  const gameOverScreen = document.getElementById('game-over-screen');
  const leaderboardScreen = document.getElementById('leaderboard-screen');
  const settingsScreen = document.getElementById('settings-screen');
  const gameGrid = document.querySelector('.grid');

  class Platform {
    constructor(newPlatBottom, newPlatLeft) {
      this.left = newPlatLeft;
      this.bottom = newPlatBottom;
      this.visual = document.createElement('div');
      this.type = this.getRandomPlatformType();
      this.visual.classList.add('platform', `platform-${this.type}`);
      this.visual.style.left = this.left + 'px';
      this.visual.style.bottom = this.bottom + 'px';
      grid.appendChild(this.visual);

      if (this.type === 'red') {
        this.direction = Math.random() > 0.5 ? 'right' : 'left';
      }
    }

    getRandomPlatformType() {
      const types = ['green', 'green', 'green', 'green', 'red', 'blue', 'yellow'];
      return types[Math.floor(Math.random() * types.length)];
    }
  }

  class GameObject {
    constructor(bottom, left, type) {
      this.bottom = bottom;
      this.left = left;
      this.type = type;
      this.visual = document.createElement('div');
      this.visual.classList.add('game-object', `game-object-${this.type}`);
      this.visual.style.bottom = this.bottom + 'px';
      this.visual.style.left = this.left + 'px';
      grid.appendChild(this.visual);

      if (this.type === 'virus') {
        setInterval(() => {
          this.shoot();
        }, 2000);
      }
    }

    shoot() {
      const newProjectile = new Projectile(this.bottom, this.left);
      projectiles.push(newProjectile);
    }
  }

  class Projectile {
    constructor(bottom, left) {
      this.bottom = bottom;
      this.left = left;
      this.visual = document.createElement('div');
      this.visual.classList.add('projectile');
      this.visual.style.left = this.left + 'px';
      this.visual.style.bottom = this.bottom + 'px';
      grid.appendChild(this.visual);
    }
  }

  function createDoodler() {
    grid.appendChild(doodler);
    doodler.classList.add('doodler');
    doodler.style.left = doodlerLeftSpace + 'px';
    doodler.style.bottom = doodlerBottomSpace + 'px';
  }

  function updateLives() {
    const livesHud = document.getElementById('lives-hud');
    livesHud.innerHTML = '';
    for (let i = 0; i < lives; i++) {
      const heart = document.createElement('img');
      heart.src = 'bonus_heart.png';
      heart.classList.add('heart');
      livesHud.appendChild(heart);
    }
  }

  function jump(height = 200) {
    clearInterval(downTimerId);
    isJumping = true;
    upTimerId = setInterval(function () {
      doodlerBottomSpace += 20;
      doodler.style.bottom = doodlerBottomSpace + 'px';
      if (doodlerBottomSpace > startPoint + height) {
        fall();
      }
    }, 30);
  }

  function fall() {
    clearInterval(upTimerId);
    isJumping = false;
    downTimerId = setInterval(function () {
      doodlerBottomSpace -= 5;
      doodler.style.bottom = doodlerBottomSpace + 'px';
      if (doodlerBottomSpace <= 0) {
        lives--;
        updateLives();
        if (lives > 0) {
          doodlerBottomSpace = startPoint;
          jump();
        } else {
          gameOver();
        }
      }

      platforms.forEach((platform, index) => {
        if (
          (doodlerBottomSpace >= platform.bottom) &&
          (doodlerBottomSpace <= (platform.bottom + 15)) &&
          ((doodlerLeftSpace + 60) >= platform.left) &&
          (doodlerLeftSpace <= (platform.left + 85)) &&
          !isJumping
        ) {
          startPoint = doodlerBottomSpace;
          if (platform.type === 'yellow') {
            jump(250);
          } else {
            jump();
          }
          isJumping = true;

          if (platform.type === 'blue') {
            const disappearTime = 500 - (difficultyLevel * 50);
            setTimeout(() => {
              platform.visual.remove();
              platforms.splice(index, 1);
            }, Math.max(disappearTime, 100));
          }
        }
      });

      gameObjects.forEach((obj, index) => {
        if (
          (doodlerBottomSpace + 80 >= obj.bottom) &&
          (doodlerBottomSpace <= (obj.bottom + 50)) &&
          ((doodlerLeftSpace + 80) >= obj.left) &&
          (doodlerLeftSpace <= (obj.left + 50))
        ) {
          if ((obj.type === 'bug' || obj.type === 'chip') && !isRocketActive) {
            lives--;
            updateLives();
            obj.visual.remove();
            gameObjects.splice(index, 1);
          } else if (obj.type === 'heart') {
            if (lives < 3) {
              lives++;
              updateLives();
            }
            obj.visual.remove();
            gameObjects.splice(index, 1);
          } else if (obj.type === 'magnet') {
            if (!isMagnetActive) {
              isMagnetActive = true;
              magnetTimerId = setTimeout(() => {
                isMagnetActive = false;
              }, 5000);
            }
            obj.visual.remove();
            gameObjects.splice(index, 1);
          } else if (obj.type === 'rocket') {
            if (!isRocketActive) {
              isRocketActive = true;
              doodlerBottomSpace += 500;
              obj.visual.remove();
              gameObjects.splice(index, 1);
              rocketTimerId = setTimeout(() => {
                isRocketActive = false;
              }, 3000);
            }
          }
        }
      });

      projectiles.forEach((p, index) => {
        if (
          (doodlerBottomSpace + 80 >= p.bottom) &&
          (doodlerBottomSpace <= (p.bottom + 10)) &&
          ((doodlerLeftSpace + 80) >= p.left) &&
          (doodlerLeftSpace <= (p.left + 10)) &&
          !isRocketActive
        ) {
          lives--;
          updateLives();
          p.visual.remove();
          projectiles.splice(index, 1);
        }
      });
    }, 20);
  }

  function createPlatforms() {
    for (let i = 0; i < platformCount; i++) {
      let platGap = 600 / platformCount;
      let newPlatBottom = 100 + i * platGap;
      let newPlatformLeft = Math.random() * 315;
      let newPlatform = new Platform(newPlatBottom, newPlatformLeft);
      platforms.push(newPlatform);

      if (Math.random() > 0.7) {
        const objectType = Math.random() > 0.5 ? 'enemy' : 'bonus';
        let newGameObject;
        if (objectType === 'enemy') {
          const enemyTypes = ['bug', 'chip', 'virus'];
          const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
          newGameObject = new GameObject(newPlatBottom + 20, newPlatform.left + 20, randomEnemy);
        } else {
          const bonusTypes = ['heart', 'magnet', 'rocket'];
          const randomBonus = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
          newGameObject = new GameObject(newPlatBottom + 20, newPlatform.left + 20, randomBonus);
        }
        gameObjects.push(newGameObject);
      }
    }
  }

  function movePlatforms() {
    if (doodlerBottomSpace > 200) {
      platforms.forEach(platform => {
        if (platform.type === 'red') {
          if (platform.direction === 'right') {
            platform.left += platformMoveSpeed;
          } else {
            platform.left -= platformMoveSpeed;
          }
          if (platform.left >= 315) {
            platform.direction = 'left';
          } else if (platform.left <= 0) {
            platform.direction = 'right';
          }
          platform.visual.style.left = platform.left + 'px';
        }

        platform.bottom -= gameSpeed;
        platform.visual.style.bottom = platform.bottom + 'px';

        if (platform.bottom < 10) {
          let firstPlatform = platforms[0].visual;
          firstPlatform.remove();
          platforms.shift();
          score++;
          document.getElementById('score').textContent = score;
          let newPlatLeft = Math.random() * 315;
          let newPlatform = new Platform(600, newPlatLeft);
          platforms.push(newPlatform);
        }
      });

      if (isGoingLeft) {
        doodlerLeftSpace -= 5;
      }
      if (isGoingRight) {
        doodlerLeftSpace += 5;
      }

      if (doodlerLeftSpace <= 0) {
        doodlerLeftSpace = 0;
      }
      if (doodlerLeftSpace >= 320) {
        doodlerLeftSpace = 320;
      }

      doodler.style.left = doodlerLeftSpace + 'px';

      gameObjects.forEach(obj => {
        obj.bottom -= gameSpeed;
        obj.visual.style.bottom = obj.bottom + 'px';
      });

      projectiles.forEach(p => {
        p.bottom -= projectileSpeed;
        p.visual.style.bottom = p.bottom + 'px';
      });

      checkMagnetEffect();
      checkDifficulty();
    }
  }

  function checkMagnetEffect() {
    if (isMagnetActive) {
      gameObjects.forEach((obj) => {
        if (obj.type !== 'magnet' && obj.type !== 'bug' && obj.type !== 'chip' && obj.type !== 'virus') {
          const distanceX = obj.left - doodlerLeftSpace;
          const distanceY = obj.bottom - doodlerBottomSpace;
          const pullRadius = 150;

          if (Math.abs(distanceX) < pullRadius && Math.abs(distanceY) < pullRadius) {
            if (distanceX > 0) {
              obj.left -= 5;
            } else {
              obj.left += 5;
            }
            if (distanceY > 0) {
              obj.bottom -= 5;
            } else {
              obj.bottom += 5;
            }
            obj.visual.style.left = obj.left + 'px';
            obj.visual.style.bottom = obj.bottom + 'px';
          }
        }
      });
    }
  }

  function checkDifficulty() {
    if (score >= difficultyLevel * difficultyThreshold) {
      difficultyLevel++;
      gameSpeed += 0.5;
      projectileSpeed += 0.5;
      platformMoveSpeed += 0.2;
      console.log(`Рівень складності підвищено до ${difficultyLevel}!`);
    }
  }

  function control(e) {
    if (e.key === 'ArrowLeft') {
      isGoingLeft = true;
    } else if (e.key === 'ArrowRight') {
      isGoingRight = true;
    }
  }

  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') {
      isGoingLeft = false;
    } else if (e.key === 'ArrowRight') {
      isGoingRight = false;
    }
  });

  // Додано підтримку управління для мобільних пристроїв
  document.addEventListener('mousedown', (e) => {
    if (e.clientX < window.innerWidth / 2) {
      isGoingLeft = true;
      isGoingRight = false;
    } else {
      isGoingRight = true;
      isGoingLeft = false;
    }
  });
  document.addEventListener('mouseup', () => {
    isGoingLeft = false;
    isGoingRight = false;
  });
  
  document.addEventListener('touchstart', (e) => {
    if (e.touches[0].clientX < window.innerWidth / 2) {
      isGoingLeft = true;
      isGoingRight = false;
    } else {
      isGoingRight = true;
      isGoingLeft = false;
    }
  });
  document.addEventListener('touchend', () => {
    isGoingLeft = false;
    isGoingRight = false;
  });

  function gameOver() {
    isGameOver = true;
    clearInterval(upTimerId);
    clearInterval(downTimerId);
    document.removeEventListener('keydown', control);
    document.removeEventListener('keyup', control);
    
    while (grid.firstChild) {
      grid.removeChild(grid.firstChild);
    }

    const gameOverScreen = document.getElementById('game-over-screen');
    gameOverScreen.style.display = 'flex';
    document.getElementById('final-score').textContent = score;
  }

  function showScreen(screen) {
    mainMenuScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    leaderboardScreen.style.display = 'none';
    settingsScreen.style.display = 'none'; // Новий екран
    gameGrid.style.display = 'none';
    screen.style.display = 'flex';
  }

  function showMainMenu() {
    showScreen(mainMenuScreen);
  }

  function showLeaderboard() {
    showScreen(leaderboardScreen);
  }
  
  function showSettings() {
    showScreen(settingsScreen);
  }

  function startGame() {
    showScreen(gameGrid);
    createDoodler();
    createPlatforms();
    setInterval(movePlatforms, 30);
    jump();
    document.addEventListener('keydown', control);
    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') {
        isGoingLeft = false;
      } else if (e.key === 'ArrowRight') {
        isGoingRight = false;
      }
    });
  }

  document.getElementById('start-button').addEventListener('click', () => {
    startGame();
  });

  document.getElementById('leaderboard-button').addEventListener('click', () => {
    showLeaderboard();
  });
  
  document.getElementById('settings-button').addEventListener('click', () => {
    showSettings();
  });

  document.getElementById('restart-button').addEventListener('click', () => {
    window.location.reload();
  });

  document.getElementById('main-menu-button').addEventListener('click', () => {
    showMainMenu();
  });

  document.getElementById('back-to-menu-button').addEventListener('click', () => {
    showMainMenu();
  });
  
  document.getElementById('back-from-settings').addEventListener('click', () => {
    showMainMenu();
  });

  showMainMenu();
});