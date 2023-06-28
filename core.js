window.addEventListener("load", start);
let canvas;
let ctx;
const ENNEMIES = 10;
const BONUSES = 3;
let mouseX, mouseY;
window.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

async function start(e) {
    canvas = document.getElementById("game");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx = canvas.getContext("2d");

    await initGame();
    mouseX = canvas.width/2;
    mouseY = canvas.height/2;

    // On space key pressed
    setShooter();


    setInterval(update, 1000/60);
    requestAnimationFrame(draw);   
}

let lastShoot = Date.now();
function setShooter() {
    window.addEventListener("keydown", async e => {
        if (e.keyCode == 32) {

            if(Date.now() - lastShoot > 250) {
                let player = getEntity("player");
                let distance = Math.sqrt(Math.pow(mouseX - player.x, 2) + Math.pow(mouseY - player.y, 2));
                let missile = {
                    image : await loadImage("missile.png"),
                    x : player.x,
                    y : player.y,
                    width : player.width/2,
                    height : player.width/2,
                    speedX : (mouseX - player.x) * 10 / distance,
                    speedY : (mouseY - player.y) * 10 / distance,
                    rotation : 0,
                    name:"missile",
                    update : missileUpdate
                };
                game.entities.push(missile);
                lastShoot = Date.now();

            }
        }
    });
}


function draw() {
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw rect #001b38
    ctx.fillStyle = "#001b38";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    
    game.entities.forEach(entity => {
        ctx.save();
        ctx.translate(entity.x, entity.y);
        ctx.rotate(entity.rotation * Math.PI / 180);
        ctx.drawImage(entity.image, -entity.width/2, -entity.height/2, entity.width, entity.height);
        ctx.restore();
    });


    // Draw life.png in top for each life point of the player
    let player = getEntity("player");
    if(player) { 
        for (let i = 0; i < player.life; i++) {
            ctx.drawImage(game.images["life.png"], 10 + i * 30, 10, 30, 30);
        }

        // Draw a green bar to show the progression of the next shoot ()
        let progression_percent = (Date.now() - lastShoot) / 250 * 100;
        if(progression_percent > 100) progression_percent = 100;
        let bar_width = canvas.width/4;
        ctx.fillStyle = "green";
        ctx.fillRect(canvas.width/2 - bar_width/2, 10, bar_width * progression_percent / 100, 30);
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(canvas.width/2 - bar_width/2, 10, bar_width, 30);
        
        


    }

    // draw bug.png near a  text with the number of ennemies left
    let ennemies = getEntities("ennemy");
    if (ennemies.length > 0) {
        ctx.drawImage(game.images["bug.png"], canvas.width - 50, 10, 30, 30);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.fillText(ennemies.length, canvas.width - 80, 40);
    }

    



    ctx.restore();
    requestAnimationFrame(draw);
}



function update() {


    game.entities.forEach(entity => {
        entity.x += entity.speedX;
        entity.y += entity.speedY;
    });

    game.entities.forEach(entity => { if (entity.update) { entity.update();}});
}

function missileUpdate() {
    let missile = this;
    // If missile is out of screen, remove it
    if (missile.x < 0 || missile.x > canvas.width || missile.y < 0 || missile.y > canvas.height) {
        game.entities.splice(game.entities.indexOf(missile), 1);
    }
    // If missile collide with ennemy, remove both
    let ennemies = getEntities("ennemy");
    ennemies.forEach(ennemy => {
        if (collide(missile, ennemy)) {
            game.entities.splice(game.entities.indexOf(missile), 1);
            game.entities.splice(game.entities.indexOf(ennemy), 1);
        }
    });

    // if missile is from boss, check if it collide with player
    let bossMissile = getEntity("bossMissile");
    if(bossMissile == this) {
        let player = getEntity("player");
        if (collide(missile, player)) {
            game.entities.splice(game.entities.indexOf(missile), 1);
            player.life--;
        }
    }

}



function playerUpdate() {
    this.rotation++;
    // Define speedX and speedY to make it follow the mouse slowly
    let distance = Math.sqrt(Math.pow(mouseX - this.x, 2) + Math.pow(mouseY - this.y, 2));
    this.speed = distance/10;
    this.speedX = (mouseX - this.x) * this.speed / distance;
    this.speedY = (mouseY - this.y) *this.speed / distance;

    // If player collide ennemy, remove enney and lose life point
    let ennemies = getEntities("ennemy");
    ennemies.forEach(ennemy => {
        if (collide(this, ennemy)) {
            game.entities.splice(game.entities.indexOf(ennemy), 1);
            this.life--;
        }
    });
    if (this.life <= 0) {
        // Remove player
        game.entities.splice(game.entities.indexOf(this), 1);
        console.log("Game Over");
    }

}



function ennemyUpdate() {
    let ennemy = this;
    if (ennemy.x - ennemy.width/2 < 0 || ennemy.x + ennemy.width/2 > canvas.width) {
           ennemy.speedX *= -1;
    }
    if (ennemy.y - ennemy.height/2 < 0 || ennemy.y + ennemy.height/2 > canvas.height) {
        ennemy.speedY *= -1;
    }
    ennemy.rotation = Math.atan2(ennemy.speedY, ennemy.speedX) * 180 / Math.PI;

    let ennemies = getEntities("ennemy");
    ennemies.forEach(other => {
        if (other == ennemy) {
            return;
        }
        if (collide(ennemy, other)) {
            let dx = other.x - ennemy.x;
            let dy = other.y - ennemy.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            let angle = Math.atan2(dy, dx);
            let tx = ennemy.x + Math.cos(angle) * (ennemy.width/2 + other.width/2);
            let ty = ennemy.y + Math.sin(angle) * (ennemy.height/2 + other.height/2);
            let ax = (tx - other.x) * 0.01;
            let ay = (ty - other.y) * 0.01;
            ennemy.speedX -= ax;
            ennemy.speedY -= ay;
            other.speedX += ax;
            other.speedY += ay;
        }
    });
}
    

function collide(a, b) {
    return a.x - a.width/2 < b.x + b.width/2
        && a.x + a.width/2 > b.x - b.width/2
        && a.y - a.height/2 < b.y + b.height/2
        && a.y + a.height/2 > b.y - b.height/2;
}

async function initGame() {
    game.entities = []
    game.images = {};
    game.images["life.png"] = await loadImage("life.png");
    game.images["bug.png"] = await loadImage("bug.png");
    game.entities.push({
        image : await loadImage("KFT.png"),
        x : canvas.width/2 + canvas.width/20/2,
        y : canvas.height/2 ,
        width : canvas.width/20,
        height : canvas.width/20,
        speedX : 0,
        speedY : 0,
        rotation : 0,
        name:"player",
        life : 3,
        update: playerUpdate
    });

    for(let i = 0; i < ENNEMIES; i++) {
        let width = canvas.width/20;
        let height = canvas.width/20;
        game.entities.push({
            image : await loadImage("bug.png"),
            x : Math.random() * ((canvas.width - width/2) - width/2) + width/2 ,
            y : Math.random() * ((canvas.height - height/2) - height/2) + height/2,
            width : width,
            height : height,
            speedX : Math.random() * 10 - 5,
            speedY : Math.random() * 10 - 5,
            rotation : 0,
            name:"ennemy",
            update : ennemyUpdate
        });
    }

    // Create the boss (it follows the player, its size is 1.5 times the player size and it is slow)
    game.entities.push({
        image : await loadImage("boss.png"),
        x : canvas.width/10,
        y : canvas.height/10 ,
        width : canvas.width/20 * 1.5,
        height : canvas.width/20 * 1.5,
        speedX : 0,
        speedY : 0,
        rotation : 0,
        name:"boss",
        life : 4,
        update: bossUpdate
    });



    // SPAWN BONUSES
    for(let i = 0; i < BONUSES; i++) {
        let width = canvas.width/20;
        let height = canvas.width/20;
        game.entities.push({
            image : await loadImage("bonus.png"),
            x : Math.random() * ((canvas.width - width/2) - width/2) + width/2 ,
            y : Math.random() * ((canvas.height - height/2) - height/2) + height/2,
            width : width,
            height : height,
            speedX : 0,
            speedY : 0,
            rotation : 0,
            name:"bonus",
            update : bonusUpdate
        });
    }

}

let lastBossShoot = 0;
async function bossUpdate() {
    // The boss follow slowly the player 
    let boss = this;
    let player = getEntity("player");
    let dx = player.x - boss.x;
    let dy = player.y - boss.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 10) {
        let angle = Math.atan2(dy, dx);
        let ax = Math.cos(angle) * 1;
        let ay = Math.sin(angle) * 1;
        boss.speedX = ax;
        boss.speedY = ay;
    }

    // If collide player, the player die
    if (collide(boss, player)) {
        player.life = 0;
    }

    
    // if collide missile, the boss lose 1 life
    let missiles = getEntities("missile");
    missiles.forEach(missile => {
        if (collide(boss, missile)) {
            boss.life--;
            removeEntity(missile);
            if(boss.life <= 0) {
                removeEntity(boss);
            }
        }
    }
    );

    // Rotation follow direction
    boss.rotation = Math.atan2(boss.speedY, boss.speedX) * 180 / Math.PI;

    // Shoot missiles every seconds to the player
    if (Date.now() - lastBossShoot > 1000) {
        let dx = player.x - boss.x;
        let dy = player.y - boss.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        let ax = Math.cos(angle) * 5;
        let ay = Math.sin(angle) * 5;
        game.entities.push({
            image : await loadImage("missile.png"),
            x : boss.x,
            y : boss.y,
            width : canvas.width/40,
            height : canvas.width/40,
            speedX : ax,
            speedY : ay,
            rotation : 0,
            name:"bossMissile",
            update : missileUpdate
        });
        lastBossShoot = Date.now();
    }

    


}

function bonusUpdate() {
    let bonus = this;
    if (collide(bonus, getEntity("player"))) {
        game.entities.splice(game.entities.indexOf(bonus), 1);
        getEntity("player").life++;
    }
}


function removeEntity(entity) {
    let index = game.entities.indexOf(entity);
    if (index != -1) {
        game.entities.splice(index, 1);
    }
}


function getEntity(name) {
    for (let i = 0; i < game.entities.length; i++) {
        if (game.entities[i].name == name) {
            return game.entities[i];
        }
    }
    return null;
}

function getEntities(name) {
    let entities = [];
    for (let i = 0; i < game.entities.length; i++) {
        if (game.entities[i].name == name) {
            entities.push(game.entities[i]);
        }
    }
    return entities;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.src = src;
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}