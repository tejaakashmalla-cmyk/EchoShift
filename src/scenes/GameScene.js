import Phaser from "phaser";

const LEVEL = {
  width: 4200,
  height: 720,
  spawn: { x: 130, y: 500 },

  platforms: {
    prime: [
      [0,650,850],[980,560,380],[1450,650,520],
      [2070,520,330],[2520,620,430],[3100,500,420],
      [3650,620,500],[760,510,120],[1740,470,120]
    ],

    echo: [
      [0,650,500],[610,560,340],[1120,620,260],
      [1510,520,360],[2010,650,440],[2470,510,260],
      [2860,610,420],[3340,560,300],[3820,460,330],
      [900,430,110],[2250,430,120]
    ]
  },

  enemies: {
    prime: [
      [700,450],
      [1700,410],
      [2760,560],
      [3440,420]
    ],

    echo: [
      [820,600],
      [1260,520],
      [2330,460],
      [3200,520],
      [3960,380]
    ]
  },

  crystals: {
    prime: [
      [420,590],[1160,500],[1620,590],
      [2210,460],[2670,560],[3250,440]
    ],

    echo: [
      [250,590],[760,500],[1290,560],
      [1690,460],[2610,450],[3440,500],[3970,400]
    ]
  }
};

export default class GameScene extends Phaser.Scene {

  constructor() {
    super("GameScene");
  }

  create() {

    // -----------------------------
    // GAME STATE
    // -----------------------------

    this.timeline = "prime";

    this.score = 0;
    this.collected = 0;

    this.health = 3;
    this.maxHealth = 3;

    this.energy = 100;
    this.maxEnergy = 100;

    this.shiftCooldown = 0;
    this.invulnerableUntil = 0;

    this.levelStart = performance.now();

    this.lastTrail = 0;
    this.lastFootstep = 0;
    this.lastShot = 0;

    this.facing = 1;

    // -----------------------------
    // WORLD
    // -----------------------------

    this.createPlayer();
    this.createWorld();
    this.createEcho();

    this.createCombatAssets();

    this.createCollectibles();
    this.createEnemies();

    this.createExit();
    this.createDecor();

    this.createHUD();
    this.createInput();
    this.setupAudio();

    // -----------------------------
    // CAMERA
    // -----------------------------

    this.cameras.main.setBounds(
      0,
      0,
      LEVEL.width,
      LEVEL.height
    );

    this.cameras.main.startFollow(
      this.player,
      true,
      .075,
      .075
    );

    this.cameras.main.setDeadzone(300, 140);

    // -----------------------------
    // SHIFT EFFECT
    // -----------------------------

    this.transitionOverlay =
      this.add.rectangle(
        0,
        0,
        1280,
        720,
        0x66e3ff,
        0
      )
      .setScrollFactor(0)
      .setDepth(100);
  }

  // ============================================================
  // PLAYER
  // ============================================================

  createPlayer() {

    this.player =
      this.physics.add.sprite(
        LEVEL.spawn.x,
        LEVEL.spawn.y,
        "player"
      );

    this.player
      .setSize(22, 38)
      .setOffset(7, 3)
      .setCollideWorldBounds(true)
      .setDragX(900)
      .setMaxVelocity(330, 900)
      .setDepth(10);
  }

  // ============================================================
  // WORLD
  // ============================================================

  createWorld() {

    const bg =
      this.add.graphics()
        .setDepth(-30);

    bg.fillGradientStyle(
      0x070a14,
      0x0d1425,
      0x04060d,
      0x07171b,
      1
    );

    bg.fillRect(
      0,
      0,
      LEVEL.width,
      LEVEL.height
    );

    this.parallaxFar =
      this.add.graphics()
        .setDepth(-25);

    this.parallaxMid =
      this.add.graphics()
        .setDepth(-24);

    this.drawSkyline(
      this.parallaxFar,
      0x0b1120,
      0.55,
      40,
      210,
      105
    );

    this.drawSkyline(
      this.parallaxMid,
      0x101a2d,
      0.8,
      70,
      260,
      125
    );

    this.scanlines =
      this.add.graphics()
        .setDepth(-5);

    for (
      let y = 0;
      y < 720;
      y += 5
    ) {

      this.scanlines
        .lineStyle(
          1,
          0xffffff,
          0.012
        )
        .lineBetween(
          0,
          y,
          LEVEL.width,
          y
        );
    }

    this.primeGroup =
      this.physics.add.staticGroup();

    this.echoGroup =
      this.physics.add.staticGroup();

    this.buildPlatforms(
      this.primeGroup,
      LEVEL.platforms.prime,
      0x344768
    );

    this.buildPlatforms(
      this.echoGroup,
      LEVEL.platforms.echo,
      0x1c4e57
    );

    this.echoGroup.setVisible(false);

    this.physics.add.collider(
      this.player,
      this.primeGroup,
      null,
      () => this.timeline === "prime",
      this
    );

    this.physics.add.collider(
      this.player,
      this.echoGroup,
      null,
      () => this.timeline === "echo",
      this
    );
  }

  drawSkyline(
    graphics,
    tint,
    alpha,
    minHeight,
    maxHeight,
    step
  ) {

    for (
      let x = 0;
      x < LEVEL.width;
      x += step
    ) {

      const height =
        Phaser.Math.Between(
          minHeight,
          maxHeight
        );

      const width =
        Phaser.Math.Between(
          step - 35,
          step - 8
        );

      graphics
        .fillStyle(
          tint,
          alpha
        )
        .fillRect(
          x,
          650 - height,
          width,
          height
        );

      if (width > 65) {

        graphics
          .fillStyle(
            0x5b7092,
            alpha * 0.25
          );

        for (
          let y = 650 - height + 24;
          y < 630;
          y += 28
        ) {

          graphics.fillRect(
            x + 14,
            y,
            4,
            3
          );
        }
      }
    }
  }

  buildPlatforms(
    group,
    list,
    tint
  ) {

    list.forEach(
      ([x, y, width]) => {

        const platform =
          this.add.image(
            x + width / 2,
            y + 12,
            "platform"
          );

        platform
          .setDisplaySize(
            width,
            24
          )
          .setTint(tint)
          .setDepth(2);

        group.add(platform);
      }
    );
  }

  // ============================================================
  // TEMPORAL ECHO
  // ============================================================

  createEcho() {

    this.echo =
      this.physics.add.sprite(
        this.player.x - 70,
        this.player.y,
        "echo"
      );

    this.echo
      .setAlpha(0.36)
      .setDepth(8);

    this.echo.body.allowGravity = false;
    this.echo.body.immovable = true;
  }

  // ============================================================
  // COMBAT ASSETS
  // ============================================================

  createCombatAssets() {

    const graphics =
      this.make.graphics({
        x: 0,
        y: 0,
        add: false
      });

    // PLAYER BULLET

    graphics.clear();

    graphics.fillStyle(
      0xd9ff5f,
      1
    );

    graphics.fillCircle(
      8,
      4,
      4
    );

    graphics.generateTexture(
      "playerBullet",
      16,
      8
    );

    // ENEMY BULLET

    graphics.clear();

    graphics.fillStyle(
      0xff5578,
      1
    );

    graphics.fillCircle(
      8,
      4,
      4
    );

    graphics.generateTexture(
      "enemyBullet",
      16,
      8
    );

    graphics.destroy();
  }

  // ============================================================
  // COLLECTIBLES
  // ============================================================

  createCollectibles() {

    this.crystalsPrime =
      this.physics.add.group();

    this.crystalsEcho =
      this.physics.add.group();

    this.populateCrystals(
      this.crystalsPrime,
      LEVEL.crystals.prime,
      "prime"
    );

    this.populateCrystals(
      this.crystalsEcho,
      LEVEL.crystals.echo,
      "echo"
    );

    this.physics.add.overlap(
      this.player,
      this.crystalsPrime,
      (_, crystal) =>
        this.collectCrystal(crystal),
      () => this.timeline === "prime",
      this
    );

    this.physics.add.overlap(
      this.player,
      this.crystalsEcho,
      (_, crystal) =>
        this.collectCrystal(crystal),
      () => this.timeline === "echo",
      this
    );
  }

  populateCrystals(
    group,
    list,
    timeline
  ) {

    list.forEach(
      ([x, y]) => {

        const crystal =
          group.create(
            x,
            y,
            "crystal"
          );

        crystal.body.allowGravity = false;

        crystal.body.setCircle(
          12,
          4,
          4
        );

        crystal.setData(
          "timeline",
          timeline
        );

        crystal.setData(
          "baseY",
          y
        );

        crystal
          .setVisible(
            timeline === this.timeline
          )
          .setDepth(7);
      }
    );
  }

  // ============================================================
  // ENEMY SYSTEM
  // ============================================================

  createEnemies() {

    this.enemiesPrime =
      this.physics.add.group();

    this.enemiesEcho =
      this.physics.add.group();

    this.populateEnemies(
      this.enemiesPrime,
      LEVEL.enemies.prime,
      "prime"
    );

    this.populateEnemies(
      this.enemiesEcho,
      LEVEL.enemies.echo,
      "echo"
    );

    // PLAYER VS ENEMY

    this.physics.add.overlap(
      this.player,
      this.enemiesPrime,
      (_, enemy) =>
        this.enemyContact(enemy),
      () => this.timeline === "prime",
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemiesEcho,
      (_, enemy) =>
        this.enemyContact(enemy),
      () => this.timeline === "echo",
      this
    );

    // BULLETS VS ENEMIES

    this.physics.add.overlap(
      this.playerBullets,
      this.enemiesPrime,
      (bullet, enemy) =>
        this.hitEnemy(bullet, enemy),
      () => this.timeline === "prime",
      this
    );

    this.physics.add.overlap(
      this.playerBullets,
      this.enemiesEcho,
      (bullet, enemy) =>
        this.hitEnemy(bullet, enemy),
      () => this.timeline === "echo",
      this
    );
  }

  populateEnemies(
    group,
    list,
    timeline
  ) {

    list.forEach(
      ([x, y], index) => {

        const enemy =
          group.create(
            x,
            y,
            "drone"
          );

        enemy.body.allowGravity = false;

        enemy.setDepth(7);

        enemy.setData(
          "timeline",
          timeline
        );

        enemy.setData(
          "originX",
          x
        );

        enemy.setData(
          "originY",
          y
        );

        enemy.setData(
          "phase",
          index * 1.7
        );

        enemy.setData(
          "health",
          3
        );

        enemy.setData(
          "maxHealth",
          3
        );

        enemy.setData(
          "state",
          "patrol"
        );

        enemy.setData(
          "lastAttack",
          0
        );

        enemy.setData(
          "speed",
          70 + index * 7
        );

        enemy.setData(
          "hitFlash",
          0
        );

        enemy.setVisible(
          timeline === this.timeline
        );

        // tiny health bar

        enemy.healthBack =
          this.add.rectangle(
            x,
            y - 27,
            34,
            4,
            0x182033,
            0.9
          )
          .setDepth(20)
          .setVisible(
            timeline === this.timeline
          );

        enemy.healthFill =
          this.add.rectangle(
            x,
            y - 27,
            34,
            4,
            0xff5578,
            1
          )
          .setDepth(21)
          .setVisible(
            timeline === this.timeline
          );

        enemy.healthBack.setOrigin(
          0.5,
          0.5
        );

        enemy.healthFill.setOrigin(
          0.5,
          0.5
        );
      }
    );
  }

  // ============================================================
  // ENEMY AI
  // ============================================================

  updateEnemies(time) {

    const activeGroup =
      this.timeline === "prime"
        ? this.enemiesPrime
        : this.enemiesEcho;

    activeGroup.children.iterate(
      enemy => {

        if (!enemy || !enemy.active)
          return;

        const distance =
          Phaser.Math.Distance.Between(
            enemy.x,
            enemy.y,
            this.player.x,
            this.player.y
          );

        const detectionRange = 360;

        // -------------------------
        // PATROL
        // -------------------------

        if (
          distance >
          detectionRange
        ) {

          enemy.setData(
            "state",
            "patrol"
          );

          const originX =
            enemy.getData(
              "originX"
            );

          const phase =
            enemy.getData(
              "phase"
            );

          enemy.x =
            originX +
            Math.sin(
              time * 0.0012 +
              phase
            ) * 85;

          enemy.y =
            enemy.getData(
              "originY"
            ) +
            Math.cos(
              time * 0.0017 +
              phase
            ) * 28;

          enemy.rotation += 0.012;

        }

        // -------------------------
        // CHASE
        // -------------------------

        else if (
          distance > 150
        ) {

          enemy.setData(
            "state",
            "chase"
          );

          const direction =
            this.player.x > enemy.x
              ? 1
              : -1;

          enemy.x +=
            direction *
            enemy.getData(
              "speed"
            ) *
            0.016;

          enemy.y =
            Phaser.Math.Linear(
              enemy.y,
              this.player.y,
              0.02
            );

          enemy.setTint(
            0xff8299
          );
        }

        // -------------------------
        // ATTACK
        // -------------------------

        else {

          enemy.setData(
            "state",
            "attack"
          );

          enemy.clearTint();

          const lastAttack =
            enemy.getData(
              "lastAttack"
            );

          if (
            time -
              lastAttack >
            1100
          ) {

            enemy.setData(
              "lastAttack",
              time
            );

            this.enemyShoot(
              enemy
            );
          }
        }

        // -------------------------
        // HEALTH BAR
        // -------------------------

        if (
          enemy.healthBack &&
          enemy.healthFill
        ) {

          enemy.healthBack.x =
            enemy.x;

          enemy.healthBack.y =
            enemy.y - 27;

          enemy.healthFill.x =
            enemy.x;

          enemy.healthFill.y =
            enemy.y - 27;

          const health =
            enemy.getData(
              "health"
            );

          const max =
            enemy.getData(
              "maxHealth"
            );

          enemy.healthFill.scaleX =
            Math.max(
              0,
              health / max
            );

          enemy.healthBack.setVisible(
            enemy.visible
          );

          enemy.healthFill.setVisible(
            enemy.visible
          );
        }
      }
    );
  }

  // ============================================================
  // PLAYER SHOOTING
  // ============================================================

  shoot() {

    const now =
      performance.now();

    // fire rate

    if (
      now - this.lastShot <
      180
    ) {
      return;
    }

    // energy cost

    if (
      this.energy <
      10
    ) {
      this.tone(
        70,
        0.05,
        "square",
        0.012
      );

      return;
    }

    this.lastShot =
      now;

    this.energy -= 10;

    const bullet =
      this.playerBullets.create(
        this.player.x +
          this.facing * 25,
        this.player.y,
        "playerBullet"
      );

    bullet.body.allowGravity =
      false;

    bullet.setVelocityX(
      this.facing * 760
    );

    bullet.setDepth(12);

    bullet.setData(
      "born",
      now
    );

    bullet.setData(
      "timeline",
      this.timeline
    );

    bullet.setTint(
      this.timeline === "prime"
        ? 0xd9ff5f
        : 0x66e3ff
    );

    this.tone(
      520,
      0.055,
      "square",
      0.018
    );

    this.createMuzzleFlash();
  }

  createMuzzleFlash() {

    const flash =
      this.add.circle(
        this.player.x +
          this.facing * 27,
        this.player.y,
        6,
        this.timeline === "prime"
          ? 0xd9ff5f
          : 0x66e3ff,
        0.9
      )
      .setDepth(15);

    this.tweens.add({
      targets: flash,
      scale: 2.5,
      alpha: 0,
      duration: 90,
      onComplete: () =>
        flash.destroy()
    });
  }

  updateBullets() {

    const now =
      performance.now();

    this.playerBullets.children.iterate(
      bullet => {

        if (
          !bullet ||
          !bullet.active
        ) {
          return;
        }

        if (
          now -
            bullet.getData("born") >
          1000
        ) {

          bullet.destroy();

          return;
        }

        if (
          bullet.x <
            -100 ||
          bullet.x >
            LEVEL.width + 100
        ) {

          bullet.destroy();
        }
      }
    );

    this.enemyBullets.children.iterate(
      bullet => {

        if (
          !bullet ||
          !bullet.active
        ) {
          return;
        }

        if (
          now -
            bullet.getData("born") >
          2500
        ) {

          bullet.destroy();

          return;
        }

        if (
          Phaser.Math.Distance.Between(
            bullet.x,
            bullet.y,
            this.player.x,
            this.player.y
          ) < 20
        ) {

          bullet.destroy();

          this.damagePlayer();
        }
      }
    );
  }

  // ============================================================
  // ENEMY SHOOTING
  // ============================================================

  enemyShoot(enemy) {

    const direction =
      this.player.x >
      enemy.x
        ? 1
        : -1;

    const bullet =
      this.enemyBullets.create(
        enemy.x +
          direction * 18,
        enemy.y,
        "enemyBullet"
      );

    bullet.body.allowGravity =
      false;

    bullet.setVelocityX(
      direction * 420
    );

    bullet.setDepth(11);

    bullet.setData(
      "born",
      performance.now()
    );

    bullet.setData(
      "timeline",
      this.timeline
    );

    bullet.setTint(
      this.timeline === "prime"
        ? 0xff5578
        : 0xff8a9e
    );

    this.tone(
      180,
      0.08,
      "sawtooth",
      0.012
    );
  }

  // ============================================================
  // DAMAGE ENEMY
  // ============================================================

  hitEnemy(
    bullet,
    enemy
  ) {

    if (
      !bullet.active ||
      !enemy.active
    ) {
      return;
    }

    // prevent cross-timeline damage

    if (
      bullet.getData(
        "timeline"
      ) !==
      enemy.getData(
        "timeline"
      )
    ) {
      return;
    }

    bullet.destroy();

    let health =
      enemy.getData(
        "health"
      );

    health--;

    enemy.setData(
      "health",
      health
    );

    enemy.setTint(
      0xffffff
    );

    this.time.delayedCall(
      80,
      () => {

        if (
          enemy.active
        ) {

          enemy.clearTint();
        }
      }
    );

    this.score += 25;

    this.tone(
      310,
      0.07,
      "triangle",
      0.018
    );

    this.createHitEffect(
      enemy.x,
      enemy.y
    );

    if (
      health <= 0
    ) {

      this.destroyEnemy(
        enemy
      );
    }
  }

  destroyEnemy(
    enemy
  ) {

    const x =
      enemy.x;

    const y =
      enemy.y;

    this.score += 150;

    this.createExplosion(
      x,
      y
    );

    if (
      enemy.healthBack
    ) {
      enemy.healthBack.destroy();
    }

    if (
      enemy.healthFill
    ) {
      enemy.healthFill.destroy();
    }

    enemy.destroy();

    this.tone(
      90,
      0.18,
      "sawtooth",
      0.03
    );
  }

  createHitEffect(
    x,
    y
  ) {

    const ring =
      this.add.circle(
        x,
        y,
        4,
        0xffffff,
        0.9
      )
      .setDepth(25);

    this.tweens.add({
      targets: ring,
      scale: 3,
      alpha: 0,
      duration: 180,
      onComplete: () =>
        ring.destroy()
    });
  }

  createExplosion(
    x,
    y
  ) {

    for (
      let i = 0;
      i < 10;
      i++
    ) {

      const particle =
        this.add.circle(
          x,
          y,
          Phaser.Math.Between(
            2,
            5
          ),
          Phaser.Math.RND.pick([
            0xff5578,
            0xffa1b4,
            0xd9ff5f
          ]),
          0.9
        )
        .setDepth(25);

      this.tweens.add({
        targets: particle,

        x:
          x +
          Phaser.Math.Between(
            -70,
            70
          ),

        y:
          y +
          Phaser.Math.Between(
            -70,
            70
          ),

        alpha: 0,

        duration: Phaser.Math.Between(
          300,
          550
        ),

        onComplete: () =>
          particle.destroy()
      });
    }

    this.cameras.main.shake(
      120,
      0.006
    );
  }

  // ============================================================
  // ENEMY CONTACT
  // ============================================================

  enemyContact(
    enemy
  ) {

    if (
      !enemy.active
    ) {
      return;
    }

    this.damagePlayer();
  }

  // ============================================================
  // EXIT
  // ============================================================

  createExit() {

    this.exit =
      this.physics.add.staticImage(
        4100,
        532,
        "exit"
      )
      .setDepth(5);

    this.exitGlow =
      this.add.circle(
        4100,
        532,
        68,
        0x65f4d3,
        0.025
      )
      .setDepth(1);

    this.tweens.add({
      targets:
        this.exitGlow,

      scale:
        1.35,

      alpha:
        0.06,

      duration:
        1100,

      yoyo:
        true,

      repeat:
        -1
    });

    this.physics.add.overlap(
      this.player,
      this.exit,
      () =>
        this.finishLevel(),
      null,
      this
    );
  }

  // ============================================================
  // DECOR
  // ============================================================

  createDecor() {

    this.rain = [];

    for (
      let i = 0;
      i < 120;
      i++
    ) {

      const line =
        this.add.rectangle(
          Phaser.Math.Between(
            0,
            LEVEL.width
          ),
          Phaser.Math.Between(
            50,
            640
          ),
          1,
          Phaser.Math.Between(
            8,
            20
          ),
          0x66e3ff,
          Phaser.Math.FloatBetween(
            0.04,
            0.12
          )
        );

      line.setDepth(-3);

      this.rain.push(
        line
      );
    }
  }

  // ============================================================
  // HUD
  // ============================================================

  createHUD() {

    this.hudPanel =
      this.add.rectangle(
        22,
        20,
        360,
        122,
        0x070b15,
        0.84
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(50)
      .setStrokeStyle(
        1,
        0x27334a,
        0.9
      );

    this.add.text(
      42,
      34,
      "ECHOSHIFT",
      {
        fontFamily:
          "Arial",

        fontSize:
          13,

        fontStyle:
          "bold",

        color:
          "#edf3ff",

        letterSpacing:
          3
      }
    )
    .setScrollFactor(0)
    .setDepth(51);

    this.add.text(
      42,
      55,
      "TEMPORAL STEALTH PROTOCOL",
      {
        fontFamily:
          "Arial",

        fontSize:
          8,

        color:
          "#62708b",

        letterSpacing:
          1.6
      }
    )
    .setScrollFactor(0)
    .setDepth(51);

    this.scoreText =
      this.add.text(
        42,
        76,
        "00000",
        {
          fontFamily:
            "Arial",

          fontSize:
            20,

          color:
            "#d9ff5f",

          fontStyle:
            "bold"
        }
      )
      .setScrollFactor(0)
      .setDepth(51);

    this.healthText =
      this.add.text(
        132,
        81,
        "● ● ●",
        {
          fontFamily:
            "Arial",

          fontSize:
            11,

          color:
            "#ff6d8a"
        }
      )
      .setScrollFactor(0)
      .setDepth(51);

    this.shardText =
      this.add.text(
        225,
        81,
        "SHARDS 00",
        {
          fontFamily:
            "Arial",

          fontSize:
            9,

          color:
            "#9aa8c0",

          letterSpacing:
            1
        }
      )
      .setScrollFactor(0)
      .setDepth(51);

    this.energyLabel =
      this.add.text(
        42,
        108,
        "ENERGY",
        {
          fontFamily:
            "Arial",

          fontSize:
            8,

          color:
            "#6e7d97",

          letterSpacing:
            1.3
        }
      )
      .setScrollFactor(0)
      .setDepth(51);

    this.energyTrack =
      this.add.rectangle(
        94,
        110,
        150,
        4,
        0x26344c,
        1
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(51);

    this.energyFill =
      this.add.rectangle(
        94,
        110,
        150,
        4,
        0xd9ff5f,
        1
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(52);

    this.weaponText =
      this.add.text(
        260,
        105,
        "F / CLICK  FIRE",
        {
          fontFamily:
            "Arial",

          fontSize:
            8,

          color:
            "#9aa8c0",

          letterSpacing:
            1
        }
      )
      .setScrollFactor(0)
      .setDepth(51);

    // TIMELINE

    this.timelinePill =
      this.add.rectangle(
        1010,
        22,
        245,
        66,
        0x0a101c,
        0.82
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(50)
      .setStrokeStyle(
        1,
        0x27334a,
        0.9
      );

    this.timelineLabel =
      this.add.text(
        1030,
        37,
        "PRIME TIMELINE",
        {
          fontFamily:
            "Arial",

          fontSize:
            12,

          fontStyle:
            "bold",

          color:
            "#d9ff5f",

          letterSpacing:
            1.5
        }
      )
      .setScrollFactor(0)
      .setDepth(51);

    this.timelineHint =
      this.add.text(
        1030,
        58,
        "E  SHIFT REALITY",
        {
          fontFamily:
            "Arial",

          fontSize:
            8,

          color:
            "#6d7b94",

          letterSpacing:
            1.3
        }
      )
      .setScrollFactor(0)
      .setDepth(51);

    this.shiftTrack =
      this.add.rectangle(
        1030,
        78,
        200,
        3,
        0x26344c,
        1
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(51);

    this.shiftFill =
      this.add.rectangle(
        1030,
        78,
        200,
        3,
        0x66e3ff,
        1
      )
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(52);

    this.objective =
      this.add.text(
        1030,
        98,
        "REACH EXTRACTION",
        {
          fontFamily:
            "Arial",

          fontSize:
            8,

          color:
            "#66758f",

          letterSpacing:
            1.2
        }
      )
      .setScrollFactor(0)
      .setDepth(51);

    this.controlText =
      this.add.text(
        640,
        681,
        "A / D MOVE    SPACE JUMP    F / CLICK FIRE    E SHIFT    R RESTART",
        {
          fontFamily:
            "Arial",

          fontSize:
            9,

          color:
            "#64718a",

          letterSpacing:
            1.1
        }
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(50);
  }

  // ============================================================
  // INPUT
  // ============================================================

  createInput() {

    this.keys =
      this.input.keyboard.addKeys({
        left:
          Phaser.Input.Keyboard.KeyCodes.LEFT,

        right:
          Phaser.Input.Keyboard.KeyCodes.RIGHT,

        a:
          Phaser.Input.Keyboard.KeyCodes.A,

        d:
          Phaser.Input.Keyboard.KeyCodes.D,

        w:
          Phaser.Input.Keyboard.KeyCodes.W,

        up:
          Phaser.Input.Keyboard.KeyCodes.UP,

        space:
          Phaser.Input.Keyboard.KeyCodes.SPACE,

        shift:
          Phaser.Input.Keyboard.KeyCodes.E,

        fire:
          Phaser.Input.Keyboard.KeyCodes.F,

        restart:
          Phaser.Input.Keyboard.KeyCodes.R
      });

    // BULLET GROUPS

    this.playerBullets =
      this.physics.add.group({
        maxSize:
          40,

        runChildUpdate:
          false
      });

    this.enemyBullets =
      this.physics.add.group({
        maxSize:
          40,

        runChildUpdate:
          false
      });

    // CLICK TO SHOOT

    this.input.on(
      "pointerdown",
      () => {

        this.unlockAudio();

        this.shoot();
      }
    );
  }

  // ============================================================
  // AUDIO
  // ============================================================

  setupAudio() {

    this.audioReady =
      false;

    this.input.once(
      "pointerdown",
      () =>
        this.unlockAudio()
    );

    this.input.keyboard.once(
      "keydown",
      () =>
        this.unlockAudio()
    );
  }

  unlockAudio() {

    if (
      this.audioReady
    ) {
      return;
    }

    this.audioReady =
      true;

    try {

      this.sound.context.resume();

    } catch (_) {}
  }

  tone(
    frequency,
    duration = 0.08,
    type = "sine",
    volume = 0.025
  ) {

    if (
      !this.audioReady
    ) {
      return;
    }

    try {

      const context =
        this.sound.context;

      const oscillator =
        context.createOscillator();

      const gain =
        context.createGain();

      oscillator.type =
        type;

      oscillator.frequency.value =
        frequency;

      gain.gain.setValueAtTime(
        volume,
        context.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime +
          duration
      );

      oscillator.connect(
        gain
      );

      gain.connect(
        context.destination
      );

      oscillator.start();

      oscillator.stop(
        context.currentTime +
          duration
      );

    } catch (_) {}
  }

  // ============================================================
  // UPDATE
  // ============================================================

  update(
    time,
    delta
  ) {

    if (
      Phaser.Input.Keyboard.JustDown(
        this.keys.restart
      )
    ) {

      return this.scene.restart();
    }

    this.shiftCooldown =
      Math.max(
        0,
        this.shiftCooldown -
          delta
      );

    // ENERGY REGEN

    this.energy =
      Math.min(
        this.maxEnergy,
        this.energy +
          delta * 0.018
      );

    this.handleMovement();

    // FIRE

    if (
      this.keys.fire.isDown
    ) {

      this.shoot();
    }

    this.updateEcho();

    this.updateCollectibles(
      time
    );

    this.updateEnemies(
      time
    );

    this.updateBullets();

    this.updateParallax();

    this.updateRain(
      time
    );

    this.updateHUD();

    this.updatePlayerMotion(
      time
    );

    if (
      this.player.y >
      LEVEL.height + 120
    ) {

      this.damagePlayer();
    }
  }

  // ============================================================
  // MOVEMENT
  // ============================================================

  handleMovement() {

    const left =
      this.keys.left.isDown ||
      this.keys.a.isDown;

    const right =
      this.keys.right.isDown ||
      this.keys.d.isDown;

    if (left) {

      this.player.setAccelerationX(
        -1350
      );

      this.facing =
        -1;

    } else if (right) {

      this.player.setAccelerationX(
        1350
      );

      this.facing =
        1;

    } else {

      this.player.setAccelerationX(
        0
      );
    }

    const grounded =
      this.player.body.blocked.down ||
      this.player.body.touching.down;

    if (
      (
        this.keys.space.isDown ||
        this.keys.up.isDown ||
        this.keys.w.isDown
      ) &&
      grounded
    ) {

      this.player.setVelocityY(
        -510
      );

      this.tone(
        280,
        0.09,
        "triangle",
        0.018
      );
    }

    if (
      Phaser.Input.Keyboard.JustDown(
        this.keys.shift
      ) &&
      this.shiftCooldown <= 0
    ) {

      this.shiftTimeline();
    }
  }

  // ============================================================
  // PLAYER MOTION
  // ============================================================

  updatePlayerMotion(
    time
  ) {

    const moving =
      Math.abs(
        this.player.body.velocity.x
      ) > 35;

    const grounded =
      this.player.body.blocked.down ||
      this.player.body.touching.down;

    if (
      grounded &&
      moving
    ) {

      this.player.y +=
        Math.sin(
          time * 0.02
        ) * 0.12;

      if (
        time -
          this.lastTrail >
        90
      ) {

        this.lastTrail =
          time;

        const ghost =
          this.add.image(
            this.player.x -
              this.facing * 5,
            this.player.y,
            "echo"
          )
          .setAlpha(0.18)
          .setScale(0.9)
          .setDepth(4);

        this.tweens.add({
          targets:
            ghost,

          alpha:
            0,

          x:
            ghost.x -
            this.facing * 18,

          duration:
            240,

          onComplete:
            () =>
              ghost.destroy()
        });
      }
    }

    if (
      moving &&
      grounded &&
      time -
        this.lastFootstep >
        360
    ) {

      this.lastFootstep =
        time;

      this.tone(
        115,
        0.035,
        "square",
        0.008
      );
    }
  }

  // ============================================================
  // ECHO
  // ============================================================

  updateEcho() {

    this.echo.x =
      Phaser.Math.Linear(
        this.echo.x,
        this.player.x - 70,
        0.075
      );

    this.echo.y =
      Phaser.Math.Linear(
        this.echo.y,
        this.player.y,
        0.075
      );

    this.echo.setAlpha(
      this.timeline === "echo"
        ? 0.2
        : 0.42
    );
  }

  // ============================================================
  // COLLECTIBLES
  // ============================================================

  updateCollectibles(
    time
  ) {

    [
      this.crystalsPrime,
      this.crystalsEcho
    ].forEach(
      group => {

        group.children.iterate(
          crystal => {

            if (
              !crystal ||
              !crystal.active
            ) {
              return;
            }

            crystal.y =
              crystal.getData(
                "baseY"
              ) +
              Math.sin(
                time * 0.004 +
                crystal.x * 0.02
              ) * 6;

            crystal.rotation +=
              0.018;
          }
        );
      }
    );
  }

  // ============================================================
  // PARALLAX
  // ============================================================

  updateParallax() {

    const scrollX =
      this.cameras.main.scrollX;

    this.parallaxFar.x =
      scrollX * 0.08;

    this.parallaxMid.x =
      scrollX * 0.18;
  }

  // ============================================================
  // RAIN
  // ============================================================

  updateRain(
    time
  ) {

    for (
      const rain of this.rain
    ) {

      rain.y += 1.2;

      if (
        rain.y >
        680
      ) {

        rain.y =
          70;
      }

      rain.x +=
        Math.sin(
          time * 0.0005 +
          rain.y
        ) * 0.05;
    }
  }

  // ============================================================
  // TIMELINE SHIFT
  // ============================================================

  shiftTimeline() {

    this.timeline =
      this.timeline === "prime"
        ? "echo"
        : "prime";

    this.shiftCooldown =
      950;

    const prime =
      this.timeline === "prime";

    this.primeGroup.setVisible(
      prime
    );

    this.echoGroup.setVisible(
      !prime
    );

    this.enemiesPrime.children.iterate(
      enemy => {

        if (enemy) {

          enemy.setVisible(
            prime
          );
        }
      }
    );

    this.enemiesEcho.children.iterate(
      enemy => {

        if (enemy) {

          enemy.setVisible(
            !prime
          );
        }
      }
    );

    this.crystalsPrime.children.iterate(
      crystal => {

        if (crystal) {

          crystal.setVisible(
            prime
          );
        }
      }
    );

    this.crystalsEcho.children.iterate(
      crystal => {

        if (crystal) {

          crystal.setVisible(
            !prime
          );
        }
      }
    );

    this.player.setTint(
      prime
        ? 0xd9ff5f
        : 0x8ef2ff
    );

    this.timelineLabel.setText(
      prime
        ? "PRIME TIMELINE"
        : "ECHO TIMELINE"
    );

    this.timelineLabel.setColor(
      prime
        ? "#d9ff5f"
        : "#66e3ff"
    );

    this.timelinePill.setStrokeStyle(
      1,
      prime
        ? 0x4a5b35
        : 0x2d6170,
      0.9
    );

    this.tone(
      prime ? 180 : 230,
      0.14,
      "sawtooth",
      0.022
    );

    this.tone(
      prime ? 360 : 460,
      0.22,
      "sine",
      0.018
    );

    this.cameras.main.flash(
      170,
      prime ? 217 : 102,
      prime ? 255 : 227,
      180
    );

    this.cameras.main.shake(
      130,
      0.004
    );

    this.transitionOverlay
      .setFillStyle(
        prime
          ? 0xd9ff5f
          : 0x66e3ff
      )
      .setAlpha(
        0.13
      );

    this.tweens.add({
      targets:
        this.transitionOverlay,

      alpha:
        0,

      duration:
        420,

      ease:
        "Cubic.Out"
    });

    for (
      let i = 0;
      i < 7;
      i++
    ) {

      const shard =
        this.add.image(
          this.player.x +
            Phaser.Math.Between(
              -30,
              30
            ),
          this.player.y +
            Phaser.Math.Between(
              -45,
              35
            ),
          "crystal"
        )
        .setScale(0.35)
        .setAlpha(0.65)
        .setTint(
          prime
            ? 0xd9ff5f
            : 0x66e3ff
        )
        .setDepth(20);

      this.tweens.add({
        targets:
          shard,

        x:
          shard.x +
          Phaser.Math.Between(
            -80,
            80
          ),

        y:
          shard.y +
          Phaser.Math.Between(
            -80,
            80
          ),

        alpha:
          0,

        angle:
          Phaser.Math.Between(
            -180,
            180
          ),

        duration:
          500,

        onComplete:
          () =>
            shard.destroy()
      });
    }

    this.score +=
      10;
  }

  // ============================================================
  // COLLECT
  // ============================================================

  collectCrystal(
    crystal
  ) {

    crystal.disableBody(
      true,
      true
    );

    this.collected++;

    this.score +=
      100;

    this.energy =
      Math.min(
        this.maxEnergy,
        this.energy + 20
      );

    this.tone(
      620,
      0.07,
      "sine",
      0.022
    );

    const burst =
      this.add.circle(
        crystal.x,
        crystal.y,
        4,
        0xd9ff5f,
        0.8
      )
      .setDepth(20);

    this.tweens.add({
      targets:
        burst,

      scale:
        7,

      alpha:
        0,

      duration:
        260,

      onComplete:
        () =>
          burst.destroy()
    });
  }

  // ============================================================
  // PLAYER DAMAGE
  // ============================================================

  damagePlayer() {

    if (
      performance.now() <
      this.invulnerableUntil
    ) {

      return;
    }

    this.invulnerableUntil =
      performance.now() +
      1200;

    this.health--;

    this.player.setVelocityY(
      -310
    );

    this.player.setTint(
      0xff5578
    );

    this.cameras.main.shake(
      220,
      0.014
    );

    this.tone(
      80,
      0.16,
      "sawtooth",
      0.035
    );

    if (
      this.health <= 0
    ) {

      this.scene.start(
        "GameOverScene",
        {
          score:
            this.score,

          collected:
            this.collected,

          time:
            this.elapsed()
        }
      );

      return;
    }

    this.time.delayedCall(
      300,
      () => {

        this.player.setTint(
          this.timeline === "prime"
            ? 0xd9ff5f
            : 0x8ef2ff
        );
      }
    );
  }

  // ============================================================
  // EXIT
  // ============================================================

  createExit() {

    this.exit =
      this.physics.add.staticImage(
        4100,
        532,
        "exit"
      )
      .setDepth(5);

    this.exitGlow =
      this.add.circle(
        4100,
        532,
        68,
        0x65f4d3,
        0.025
      )
      .setDepth(1);

    this.tweens.add({
      targets:
        this.exitGlow,

      scale:
        1.35,

      alpha:
        0.06,

      duration:
        1100,

      yoyo:
        true,

      repeat:
        -1
    });

    this.physics.add.overlap(
      this.player,
      this.exit,
      () =>
        this.finishLevel(),
      null,
      this
    );
  }

  finishLevel() {

    const bonus =
      Math.max(
        0,
        1000 -
          Math.floor(
            this.elapsed() / 10
          )
      );

    this.score +=
      bonus;

    this.tone(
      440,
           0.1,
      "triangle",
      0.025
    );

    this.tone(
      660,
      0.2,
      "triangle",
      0.025
    );

    this.scene.start(
      "GameOverScene",
      {
        score:
          this.score,

        collected:
          this.collected,

        time:
          this.elapsed(),

        victory:
          true
      }
    );
  }

  // ============================================================
  // HUD UPDATE
  // ============================================================

  updateHUD() {

    this.scoreText.setText(
      String(
        this.score
      ).padStart(
        5,
        "0"
      )
    );

    this.healthText.setText(
      "● ".repeat(
        this.health
      ).trim() +
      (
        this.health <
        this.maxHealth
          ? "  " +
            "○ ".repeat(
              this.maxHealth -
              this.health
            ).trim()
          : ""
      )
    );

    this.shardText.setText(
      `SHARDS ${String(
        this.collected
      ).padStart(2, "0")}`
    );

    this.energyFill.setScale(
      Math.max(
        0.02,
        this.energy /
          this.maxEnergy
      ),
      1
    );

    this.shiftFill.setScale(
      Math.max(
        0.02,
        1 -
          this.shiftCooldown /
          950
      ),
      1
    );
  }

  // ============================================================
  // TIME
  // ============================================================

  elapsed() {

    return Math.floor(
      (
        performance.now() -
        this.levelStart
      ) / 1000
    );
  }
}
