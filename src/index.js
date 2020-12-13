import Phaser from "phaser";
import bombImg from "./assets/bomb.png";
import dudeImg from "./assets/dude.png";
import platformImg from "./assets/platform.png";
import skyImg from "./assets/skygreen.jpg";
import starImg from "./assets/star.png";
//-------------------------------------------------------------------------------------------------------------------
// The config object is how you configure your Phaser Game. There are lots of options that can be placed in this object. The type property can be either Phaser.CANVAS, Phaser.WEBGL, or Phaser.AUTO. This is the rendering context that you want to use for your game. The recommended value is Phaser.AUTO which automatically tries to use WebGL, but if the browser or device doesn't support it it'll fall back to Canvas. The canvas element that Phaser creates will be simply be appended to the document at the point the script was called, but you can also specify a parent container in the game config should you wish. The width and height properties set the size of the canvas element that Phaser will create. In this case 800 x 600 pixels. Your game world can be any size you like, but this is the resolution the game will display in.
//----------------------------------------------------------------------------------------------------------------------
var config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: "phaser-example",

    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

let player;
let stars;
let bombs;
let platforms;
let cursors;
let score = 0;
let gameOver = false;
let scoreText;
let movingPlatform;
// -----------------------------------------------------------------------------------------------------------------
// An instance of a Phaser.Game object is assigned to a local variable called game and the configuration object is passed to it. This will start the process of bringing Phaser to life.In Phaser 3 it's no longer useful to store the game instance in a global variable.Phaser will automatically look for Scene function called preload function when it starts and load anything defined within it. This will load in 5 assets: 4 images and a sprite sheet. It may appear obvious to some of you, but I would like to point out the first parameter, also known as the asset key (i.e. 'sky', 'bomb'). This string is a link to the loaded asset and is what you'll use in your code when creating Game Objects. You're free to use any valid JavaScript string as the key.
// ---------------------------------------------------------------------------------------------------------------------
const game = new Phaser.Game(config);

function preload() {
  this.load.image("sky", skyImg);
  this.load.image("ground", platformImg);
  this.load.image("star", starImg);
  this.load.image("bomb", bombImg);
  this.load.spritesheet("dude", dudeImg, {
    frameWidth: 32,
    frameHeight: 48,
  });
}
// --------------------------------------------------------------------------------------
// The values 400 and 300 are the x and y coordinates of the image. In Phaser 3 all Game Objects are positioned based on their center by default. The background image is 800 x 600 pixels in size, so ,If we display it at 400 x 300 you see the whole thing.The order in which game objects are displayed matches the order in which you create them. Under the hood this.add.image is creating a new Image Game Object and adding it to the current Scenes display list. We're using the Arcade Physics system.In Arcade Physics there are two types of physics bodies: Dynamic and Static. A dynamic body is one that can move around via forces such as velocity or acceleration. It can bounce and collide with other objects and that collision is influenced by the mass of the body and other elements. In stark contrast, a Static Body simply has a position and a size. It isn't touched by gravity, you cannot set velocity on it and when something collides with it, it never moves. Static by name, static by nature. And perfect for the ground and platforms that we're going to let the player run around on. The first line of code above adds a new ground image at 400 x 568 (remember, images are positioned based on their center) - the problem is that we need this platform to span the full width of our game, otherwise the player will just drop off the sides. To do that we scale it x2 with the function setScale(2). It's now 800 x 64 in size, which is perfect for our needs. The call to refreshBody() is required because we have scaled a static physics body, so we have to tell the physics world about the changes we made.The player, positioned at 100 x 450 pixels from the bottom of the game. The sprite's created via the Physics Game Object Factory (this.physics.add) which means it has a Dynamic Physics body by default. The sprite is then set to collide with the world bounds. The bounds, by default, are on the outside of the game dimensions. As we set the game to be 800 x 600 then the player won't be able to run outside of this area. It will stop the player from being able to run off the edges of the screen or jump through the top. When a Physics Sprite is created it is given a body property, which is a reference to its Arcade Physics Body. This represents the sprite as a physical body in Phasers Arcade Physics engine. Collider object monitors two physics objects (which can include Groups) and checks for collisions or overlap between them. If that occurs it can then optionally invoke your own callback,if required. The player sprite will move only when a key is held down and stop immediately they are not. Phaser also allows you to create more complex motions, with momentum and acceleration.
// ---------------------------------------------------------------------------------------

function create() {
  //  A simple background for our game
  this.add.image(2400, 1500, "sky");
  // this.add.image(400, 300, "sky");

  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = this.physics.add.staticGroup();

  //  Here we create the ground.
  //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
  platforms.create(400, 568, "ground").setScale(2).refreshBody();

  //  Now let's create some ledges
  platforms.create(50, 250, "ground"); //left top
  platforms.create(750, 220, "ground");

  movingPlatform = this.physics.add.image(400, 400, "ground");

  movingPlatform.setImmovable(true);
  movingPlatform.body.allowGravity = false;
  movingPlatform.setVelocityX(50);

  // The player and its settings
  player = this.physics.add.sprite(100, 450, "dude");

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  //  Input Events
  cursors = this.input.keyboard.createCursorKeys();

  //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
  stars = this.physics.add.group({
    key: "star",
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate(function (child) {
    //  Give each star a slightly different bounce
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  bombs = this.physics.add.group();

  //  The score
  scoreText = this.add.text(16, 16, "score: 0", {
    fontSize: "26px",
    fill: "#8f6c20",
  });

  // scoreText = this.add.text(16, 56, "highest: 1280", {
  //   fontSize: "15px",
  //   fill: "#ac9748",
  // });
  // text
  this.add.text(
    60,
    564,
    "Use arrow keys to collect all stars for more surprises..",
    {
      fontSize: "20px",
      fill: "#cab960",
    }
  );
  // this.add.text(100, 568, "escape bombs", {
  //   fontSize: "26px",
  //   fill: "#cab960",
  // });
  //  Collide the player and the stars with the platforms
  this.physics.add.collider(player, platforms);
  this.physics.add.collider(stars, platforms);
  this.physics.add.collider(bombs, platforms);
  this.physics.add.collider(bombs, movingPlatform);
  this.physics.add.collider(player, movingPlatform);
  this.physics.add.collider(stars, movingPlatform);

  //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
  this.physics.add.overlap(player, stars, collectStar, null, this);

  this.physics.add.collider(player, bombs, hitBomb, null, this);
}

function update() {
  if (gameOver) {
    return;
  }

  if (cursors.left.isDown) {
    player.setVelocityX(-160);

    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);

    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);

    player.anims.play("turn");
  }

  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-330);
  }

  if (movingPlatform.x >= 500) {
    movingPlatform.setVelocityX(-50);
  } else if (movingPlatform.x <= 300) {
    movingPlatform.setVelocityX(50);
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);

  //  Add and update the score
  score += 10;
  scoreText.setText("Score: " + score);

  if (stars.countActive(true) === 0) {
    //  A new batch of stars to collect
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}

function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play("turn");

  gameOver = true;
}
