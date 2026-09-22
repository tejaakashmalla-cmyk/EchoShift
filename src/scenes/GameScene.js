export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");

        this.timeline = "PRIME";
        this.score = 0;
        this.shards = 0;
        this.maxHealth = 100;
        this.health = 100;
        this.energy = 100;

        this.playerSpeed = 260;
        this.jumpPower = 520;

        this.bullets = null;
        this.enemyBullets = null;
        this.enemies = null;
        this.shardsGroup = null;

        this.lastShot = 0;
        this.lastShift = 0;
        this.gameOverState = false;
    }

    create() {
        // --------------------------------------------------
        // WORLD
        // --------------------------------------------------

        this.cameras.main.setBackgroundColor("#07111f");

        this.createBackground();
        this.createPlatforms();

        // --------------------------------------------------
        // PLAYER
        // --------------------------------------------------

        this.player = this.physics.add.sprite(
            180,
            400,
            "player"
        );

        this.player.setScale(0.8);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(28, 48);
        this.player.body.setOffset(10, 8);

        // --------------------------------------------------
        // GROUPS
        // --------------------------------------------------

        this.bullets = this.physics.add.group({
            defaultKey: "bullet",
            maxSize: 30
        });

        this.enemyBullets = this.physics.add.group({
            defaultKey: "enemyBullet",
            maxSize: 50
        });

        this.enemies = this.physics.add.group();

        this.shardsGroup = this.physics.add.group();

        // --------------------------------------------------
        // COLLISIONS
        // --------------------------------------------------

        this.physics.add.collider(
            this.player,
            this.platforms
        );

        this.physics.add.collider(
            this.enemies,
            this.platforms
        );

        this.physics.add.collider(
            this.bullets,
            this.platforms,
            this.destroyBullet,
            null,
            this
        );

        this.physics.add.collider(
            this.enemyBullets,
            this.platforms,
            this.destroyBullet,
            null,
            this
        );

        this.physics.add.overlap(
            this.bullets,
            this.enemies,
            this.hitEnemy,
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.enemyBullets,
            this.hitPlayer,
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.enemies,
            this.enemyContact,
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.shardsGroup,
            this.collectShard,
            null,
            this
        );

        // --------------------------------------------------
        // INPUT
        // --------------------------------------------------

        this.cursors = this.input.keyboard.createCursorKeys();

        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            E: Phaser.Input.Keyboard.KeyCodes.E,
            F: Phaser.Input.Keyboard.KeyCodes.F,
            R: Phaser.Input.Keyboard.KeyCodes.R
        });

        this.input.on(
            "pointerdown",
            () => {
                this.shoot();
            }
        );

        // --------------------------------------------------
        // LEVEL OBJECTS
        // --------------------------------------------------

        this.createEnemies();
        this.createShards();
        this.createExtraction();

        // --------------------------------------------------
        // CAMERA
        // --------------------------------------------------

        this.cameras.main.startFollow(
            this.player,
            true,
            0.08,
            0.08
        );

        this.cameras.main.setBounds(
            0,
            0,
            5000,
            720
        );

        // --------------------------------------------------
        // HUD
        // --------------------------------------------------

        this.createHUD();

        // --------------------------------------------------
        // FX
        // --------------------------------------------------

        this.createRain();

        this.showTimelineMessage(
            "PRIME TIMELINE",
            "#53d8ff"
        );
    }

    // ======================================================
    // BACKGROUND
    // ======================================================

    createBackground() {
        this.add.rectangle(
            2500,
            360,
            5000,
            720,
            0x07111f
        );

        // Far skyline
        for (let x = 0; x < 5000; x += 100) {
            const height = Phaser.Math.Between(
                80,
                220
            );

            const building = this.add.rectangle(
                x,
                650 - height / 2,
                70,
                height,
                0x10243a
            );

            building.setScrollFactor(0.25);
        }

        // Mid skyline
        for (let x = 0; x < 5000; x += 150) {
            const height = Phaser.Math.Between(
                120,
                300
            );

            const building = this.add.rectangle(
                x,
                650 - height / 2,
                100,
                height,
                0x152e49
            );

            building.setScrollFactor(0.45);
        }

        // Moon
        const moon = this.add.circle(
            4200,
            120,
            55,
            0xa7e8ff,
            0.7
        );

        moon.setScrollFactor(0.15);
    }

    // ======================================================
    // PLATFORMS
    // ======================================================

    createPlatforms() {
        this.platforms = this.physics.add.staticGroup();

        // Ground
        this.createPlatform(
            2500,
            690,
            5000,
            60
        );

        // Platforms
        const platforms = [
            [450, 560, 300, 25],
            [900, 470, 260, 25],
            [1300, 580, 300, 25],
            [1700, 430, 280, 25],
            [2100, 520, 300, 25],
            [2550, 400, 280, 25],
            [3000, 540, 300, 25],
            [3450, 450, 300, 25],
            [3900, 350, 300, 25],
            [4350, 500, 350, 25]
        ];

        platforms.forEach(
            ([x, y, width, height]) => {
                this.createPlatform(
                    x,
                    y,
                    width,
                    height
                );
            }
        );
    }

    createPlatform(
        x,
        y,
        width,
        height
    ) {
        const platform = this.add.rectangle(
            x,
            y,
            width,
            height,
            this.timeline === "PRIME"
                ? 0x173c5b
                : 0x42215c
        );

        platform.setStrokeStyle(
            2,
            this.timeline === "PRIME"
                ? 0x53d8ff
                : 0xff5fd7
        );

        this.physics.add.existing(
            platform,
            true
        );

        this.platforms.add(platform);

        return platform;
    }

    // ======================================================
    // PLAYER
    // ======================================================

    updatePlayer() {
        if (
            !this.player ||
            this.gameOverState
        ) {
            return;
        }

        const left =
            this.cursors.left.isDown ||
            this.keys.A.isDown;

        const right =
            this.cursors.right.isDown ||
            this.keys.D.isDown;

        if (left) {
            this.player.setVelocityX(
                -this.playerSpeed
            );

            this.player.setFlipX(true);
        } else if (right) {
            this.player.setVelocityX(
                this.playerSpeed
            );

            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }

        const jump =
            Phaser.Input.Keyboard.JustDown(
                this.cursors.up
            ) ||
            Phaser.Input.Keyboard.JustDown(
                this.keys.W
            );

        if (
            jump &&
            this.player.body.blocked.down
        ) {
            this.player.setVelocityY(
                -this.jumpPower
            );
        }

        if (
            Phaser.Input.Keyboard.JustDown(
                this.keys.E
            )
        ) {
            this.shiftTimeline();
        }

        if (
            Phaser.Input.Keyboard.JustDown(
                this.keys.F
            )
        ) {
            this.shoot();
        }

        // Mouse aiming
        const pointer =
            this.input.activePointer;

        if (
            pointer.isDown &&
            this.time.now - this.lastShot > 180
        ) {
            this.shoot();
        }
    }

    // ======================================================
    // TIMELINE SHIFT
    // ======================================================

    shiftTimeline() {
        if (
            this.time.now - this.lastShift <
            700
        ) {
            return;
        }

        if (this.energy < 15) {
            this.showTimelineMessage(
                "LOW TEMPORAL ENERGY",
                "#ffcc55"
            );

            return;
        }

        this.lastShift = this.time.now;

        this.energy -= 15;

        this.timeline =
            this.timeline === "PRIME"
                ? "ECHO"
                : "PRIME";

        this.timelineTransition();

        this.updateWorldForTimeline();

        this.showTimelineMessage(
            `${this.timeline} TIMELINE`,
            this.timeline === "PRIME"
                ? "#53d8ff"
                : "#ff5fd7"
        );

        this.updateHUD();
    }

    timelineTransition() {
        const color =
            this.timeline === "PRIME"
                ? 0x53d8ff
                : 0xff5fd7;

        const flash =
            this.add.rectangle(
                this.cameras.main.scrollX +
                    this.scale.width / 2,
                this.scale.height / 2,
                this.scale.width,
                this.scale.height,
                color,
                0.35
            );

        flash.setScrollFactor(0);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 450,
            onComplete: () => {
                flash.destroy();
            }
        });

        this.cameras.main.shake(
            220,
            0.006
        );

        // Afterimage
        const ghost =
            this.add.sprite(
                this.player.x,
                this.player.y,
                "player"
            );

        ghost.setScale(
            this.player.scaleX,
            this.player.scaleY
        );

        ghost.setTint(color);
        ghost.setAlpha(0.6);

        this.tweens.add({
            targets: ghost,
            alpha: 0,
            scale: 1.3,
            duration: 500,
            onComplete: () => {
                ghost.destroy();
            }
        });
    }

    updateWorldForTimeline() {
        const prime =
            this.timeline === "PRIME";

        this.platforms.children.iterate(
            platform => {
                if (!platform) {
                    return;
                }

                platform.setFillStyle(
                    prime
                        ? 0x173c5b
                        : 0x42215c
                );

                platform.setStrokeStyle(
                    2,
                    prime
                        ? 0x53d8ff
                        : 0xff5fd7
                );
            }
        );

        this.enemies.children.iterate(
            enemy => {
                if (!enemy) {
                    return;
                }

                enemy.setAlpha(
                    enemy.timeline ===
                        this.timeline
                        ? 1
                        : 0.15
                );
            }
        );

        this.shardsGroup.children.iterate(
            shard => {
                if (!shard) {
                    return;
                }

                shard.setAlpha(
                    shard.timeline ===
                        this.timeline
                        ? 1
                        : 0.15
                );
            }
        );
    }

    // ======================================================
    // SHOOTING
    // ======================================================

    shoot() {
        if (
            this.gameOverState ||
            this.time.now - this.lastShot <
                180
        ) {
            return;
        }

        this.lastShot = this.time.now;

        const pointer =
            this.input.activePointer;

        let direction = this.player.flipX
            ? -1
            : 1;

        if (pointer) {
            const worldPoint =
                this.cameras.main.getWorldPoint(
                    pointer.x,
                    pointer.y
                );

            direction =
                worldPoint.x >= this.player.x
                    ? 1
                    : -1;
        }

        const bullet =
            this.bullets.get(
                this.player.x +
                    direction * 30,
                this.player.y - 5,
                "bullet"
            );

        if (!bullet) {
            return;
        }

        bullet.setActive(true);
        bullet.setVisible(true);

        bullet.body.enable = true;

        bullet.setVelocityX(
            direction * 700
        );

        bullet.setVelocityY(0);

        bullet.setData(
            "damage",
            25
        );

        bullet.setData(
            "timeline",
            this.timeline
        );

        bullet.setTint(
            this.timeline === "PRIME"
                ? 0x53d8ff
                : 0xff5fd7
        );

        this.time.delayedCall(
            1200,
            () => {
                if (bullet.active) {
                    this.destroyBullet(
                        bullet
                    );
                }
            }
        );
    }

    destroyBullet(bullet) {
        if (!bullet) {
            return;
        }

        bullet.setActive(false);
        bullet.setVisible(false);

        if (bullet.body) {
            bullet.body.stop();
            bullet.body.enable = false;
        }
    }

    // ======================================================
    // ENEMIES
    // ======================================================

    createEnemies() {
        const enemyData = [
            {
                x: 700,
                y: 420,
                timeline: "PRIME"
            },
            {
                x: 1200,
                y: 520,
                timeline: "ECHO"
            },
            {
                x: 1850,
                y: 380,
                timeline: "PRIME"
            },
            {
                x: 2350,
                y: 470,
                timeline: "ECHO"
            },
            {
                x: 2850,
                y: 490,
                timeline: "PRIME"
            },
            {
                x: 3350,
                y: 400,
                timeline: "ECHO"
            },
            {
                x: 4000,
                y: 300,
                timeline: "PRIME"
            }
        ];

        enemyData.forEach(data => {
            this.createEnemy(
                data.x,
                data.y,
                data.timeline
            );
        });
    }

    createEnemy(
        x,
        y,
        timeline
    ) {
        const enemy =
            this.physics.add.sprite(
                x,
                y,
                "enemy"
            );

        enemy.setScale(0.8);

        enemy.timeline = timeline;

        enemy.maxHealth = 100;
        enemy.health = 100;

        enemy.state = "PATROL";

        enemy.speed = 80;

        enemy.direction = 1;

        enemy.patrolStart = x - 120;
        enemy.patrolEnd = x + 120;

        enemy.lastShot = 0;

        enemy.setCollideWorldBounds(
            true
        );

        enemy.body.setSize(40, 30);

        enemy.setTint(
            timeline === "PRIME"
                ? 0x53d8ff
                : 0xff5fd7
        );

        if (
            timeline !== this.timeline
        ) {
            enemy.setAlpha(0.15);
        }

        this.enemies.add(enemy);

        return enemy;
    }

    updateEnemies() {
        if (!this.enemies) {
            return;
        }

        this.enemies.children.iterate(
            enemy => {
                if (
                    !enemy ||
                    !enemy.active
                ) {
                    return;
                }

                // Different timeline
                if (
                    enemy.timeline !==
                    this.timeline
                ) {
                    enemy.setVelocityX(0);

                    enemy.state =
                        "PHASED";

                    return;
                }

                enemy.setAlpha(1);

                const distance =
                    Phaser.Math.Distance.Between(
                        enemy.x,
                        enemy.y,
                        this.player.x,
                        this.player.y
                    );

                // ------------------------------------------
                // PATROL
                // ------------------------------------------

                if (
                    distance > 420
                ) {
                    enemy.state =
                        "PATROL";

                    enemy.setVelocityX(
                        enemy.direction *
                            enemy.speed
                    );

                    if (
                        enemy.x <=
                        enemy.patrolStart
                    ) {
                        enemy.direction = 1;
                        enemy.setFlipX(false);
                    }

                    if (
                        enemy.x >=
                        enemy.patrolEnd
                    ) {
                        enemy.direction = -1;
                        enemy.setFlipX(true);
                    }

                    return;
                }

                // ------------------------------------------
                // CHASE
                // ------------------------------------------

                if (
                    distance > 220
                ) {
                    enemy.state =
                        "CHASE";

                    const direction =
                        this.player.x >
                        enemy.x
                            ? 1
                            : -1;

                    enemy.setVelocityX(
                        direction * 140
                    );

                    enemy.setFlipX(
                        direction < 0
                    );

                    return;
                }

                // ------------------------------------------
                // ATTACK
                // ------------------------------------------

                enemy.state =
                    "ATTACK";

                enemy.setVelocityX(0);

                const direction =
                    this.player.x >
                    enemy.x
                        ? 1
                        : -1;

                enemy.setFlipX(
                    direction < 0
                );

                if (
                    this.time.now -
                        enemy.lastShot >
                    1000
                ) {
                    this.enemyShoot(
                        enemy,
                        direction
                    );

                    enemy.lastShot =
                        this.time.now;
                }
            }
        );
    }

    enemyShoot(
        enemy,
        direction
    ) {
        const bullet =
            this.enemyBullets.get(
                enemy.x +
                    direction * 25,
                enemy.y,
                "enemyBullet"
            );

        if (!bullet) {
            return;
        }

        bullet.setActive(true);
        bullet.setVisible(true);

        bullet.body.enable = true;

        bullet.setVelocityX(
            direction * 330
        );

        bullet.setVelocityY(0);

        bullet.setTint(
            enemy.timeline ===
                "PRIME"
                ? 0x70e5ff
                : 0xff73dc
        );

        this.time.delayedCall(
            1800,
            () => {
                if (bullet.active) {
                    this.destroyBullet(
                        bullet
                    );
                }
            }
        );
    }

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

        if (
            enemy.timeline !==
            this.timeline
        ) {
            return;
        }

        const damage =
            bullet.getData(
                "damage"
            ) || 25;

        enemy.health -= damage;

        this.destroyBullet(
            bullet
        );

        this.enemyHitEffect(
            enemy
        );

        if (
            enemy.health <= 0
        ) {
            this.destroyEnemy(
                enemy
            );
        }
    }

    enemyHitEffect(enemy) {
        const ring =
            this.add.circle(
                enemy.x,
                enemy.y,
                15,
                0xffffff,
                0.7
            );

        this.tweens.add({
            targets: ring,
            radius: 35,
            alpha: 0,
            duration: 250,
            onComplete: () => {
                ring.destroy();
            }
        });

        enemy.setTint(0xffffff);

        this.time.delayedCall(
            100,
            () => {
                if (
                    enemy.active
                ) {
                    enemy.setTint(
                        enemy.timeline ===
                            "PRIME"
                            ? 0x53d8ff
                            : 0xff5fd7
                    );
                }
            }
        );
    }

    destroyEnemy(enemy) {
        this.score += 100;

        const explosion =
            this.add.circle(
                enemy.x,
                enemy.y,
                10,
                enemy.timeline ===
                    "PRIME"
                    ? 0x53d8ff
                    : 0xff5fd7,
                0.8
            );

        this.tweens.add({
            targets: explosion,
            radius: 55,
            alpha: 0,
            duration: 450,
            onComplete: () => {
                explosion.destroy();
            }
        });

        this.cameras.main.shake(
            100,
            0.004
        );

        enemy.disableBody(
            true,
            true
        );

        this.updateHUD();
    }

    enemyContact(
        player,
        enemy
    ) {
        if (
            enemy.timeline !==
            this.timeline
        ) {
            return;
        }

        if (
            this.time.now -
                (enemy.lastDamage || 0) <
            700
        ) {
            return;
        }

        enemy.lastDamage =
            this.time.now;

        this.damagePlayer(
            15
        );
    }

    // ======================================================
    // PLAYER DAMAGE
    // ======================================================

    hitPlayer(
        player,
        bullet
    ) {
        if (
            !bullet.active
        ) {
            return;
        }

        this.destroyBullet(
            bullet
        );

        this.damagePlayer(
            10
        );
    }

    damagePlayer(
        amount
    ) {
        if (
            this.gameOverState
        ) {
            return;
        }

        this.health -= amount;

        this.health =
            Math.max(
                0,
                this.health
            );

        this.player.setTint(
            0xff5555
        );

        this.cameras.main.shake(
            180,
            0.008
        );

        this.time.delayedCall(
            150,
            () => {
                if (
                    this.player.active
                ) {
                    this.player.clearTint();
                }
            }
        );

        this.updateHUD();

        if (
            this.health <= 0
        ) {
            this.gameOver();
        }
    }

    // ======================================================
    // SHARDS
    // ======================================================

    createShards() {
        const shardData = [
            [600, 500, "PRIME"],
            [1050, 410, "ECHO"],
            [1450, 520, "PRIME"],
            [1800, 370, "ECHO"],
            [2200, 460, "PRIME"],
            [2650, 340, "ECHO"],
            [3100, 500, "PRIME"],
            [3600, 410, "ECHO"],
            [4050, 300, "PRIME"]
        ];

        shardData.forEach(
            ([x, y, timeline]) => {
                const shard =
                    this.add.star(
                        x,
                        y,
                        6,
                        6,
                        14,
                        0x7cecff
                    );

                shard.timeline =
                    timeline;

                shard.setTint(
                    timeline === "PRIME"
                        ? 0x53d8ff
                        : 0xff5fd7
                );

                this.physics.add.existing(
                    shard
                );

                shard.body.setAllowGravity(
                    false
                );

                this.shardsGroup.add(
                    shard
                );

                if (
                    timeline !==
                    this.timeline
                ) {
                    shard.setAlpha(0.15);
                }
            }
        );
    }

    collectShard(
        player,
        shard
    ) {
        if (
            shard.timeline !==
            this.timeline
        ) {
            return;
        }

        shard.disableBody(
            true,
            true
        );

        this.shards++;

        this.score += 50;

        this.energy =
            Math.min(
                100,
                this.energy + 10
            );

        const burst =
            this.add.circle(
                shard.x,
                shard.y,
                8,
                shard.timeline ===
                    "PRIME"
                    ? 0x53d8ff
                    : 0xff5fd7,
                0.8
            );

        this.tweens.add({
            targets: burst,
            radius: 35,
            alpha: 0,
            duration: 350,
            onComplete: () => {
                burst.destroy();
            }
        });

        this.updateHUD();
    }

    // ======================================================
    // EXTRACTION
    // ======================================================

    createExtraction() {
        this.extraction = this.add.rectangle(
            4700,
            560,
            90,
            160,
            0x53d8ff,
            0.2
        );

        this.extraction.setStrokeStyle(
            4,
            0x53d8ff
        );

        this.physics.add.existing(
            this.extraction,
            true
        );

        this.extractionLabel =
            this.add.text(
                4700,
                450,
                "EXTRACTION",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "18px",
                    color:
                        "#53d8ff",
                    fontStyle:
                        "bold"
                }
            );

        this.extractionLabel.setOrigin(
            0.5
        );

        this.physics.add.overlap(
            this.player,
            this.extraction,
            this.reachExtraction,
            null,
            this
        );
    }

    reachExtraction() {
        if (
            this.gameOverState
        ) {
            return;
        }

        this.victory();
    }

    // ======================================================
    // HUD
    // ======================================================

    createHUD() {
        this.hud = {};

        this.hud.timeline =
            this.add.text(
                25,
                20,
                "PRIME TIMELINE",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "24px",
                    fontStyle:
                        "bold",
                    color:
                        "#53d8ff"
                }
            );

        this.hud.health =
            this.add.text(
                25,
                58,
                "HP: 100 / 100",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "17px",
                    color:
                        "#ffffff"
                }
            );

        this.hud.energy =
            this.add.text(
                25,
                85,
                "ENERGY: 100",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "17px",
                    color:
                        "#ffffff"
                }
            );

        this.hud.score =
            this.add.text(
                25,
                112,
                "SCORE: 0",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "17px",
                    color:
                        "#ffffff"
                }
            );

        this.hud.shards =
            this.add.text(
                25,
                139,
                "SHARDS: 0",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "17px",
                    color:
                        "#ffffff"
                }
            );

        this.hud.controls =
            this.add.text(
                25,
                675,
                "A/D Move   W/↑ Jump   F / Click Shoot   E Shift Timeline",
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "14px",
                    color:
                        "#9ab4ca"
                }
            );

        Object.values(
            this.hud
        ).forEach(
            element => {
                element.setScrollFactor(0);
                element.setDepth(1000);
            }
        );
    }

    updateHUD() {
        if (!this.hud) {
            return;
        }

        this.hud.timeline.setText(
            `${this.timeline} TIMELINE`
        );

        this.hud.timeline.setColor(
            this.timeline === "PRIME"
                ? "#53d8ff"
                : "#ff5fd7"
        );

        this.hud.health.setText(
            `HP: ${Math.ceil(
                this.health
            )} / ${this.maxHealth}`
        );

        this.hud.energy.setText(
            `ENERGY: ${Math.ceil(
                this.energy
            )}`
        );

        this.hud.score.setText(
            `SCORE: ${this.score}`
        );

        this.hud.shards.setText(
            `SHARDS: ${this.shards}`
        );
    }

    showTimelineMessage(
        message,
        color
    ) {
        const text =
            this.add.text(
                this.scale.width / 2,
                100,
                message,
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "32px",
                    fontStyle:
                        "bold",
                    color:
                        color,
                    stroke:
                        "#000000",
                    strokeThickness:
                        5
                }
            );

        text.setOrigin(0.5);

        text.setScrollFactor(0);

        text.setDepth(2000);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: 70,
            duration: 1000,
            delay: 400,
            onComplete: () => {
                text.destroy();
            }
        });
    }

    // ======================================================
    // RAIN
    // ======================================================

    createRain() {
        this.rain = [];

        for (
            let i = 0;
            i < 120;
            i++
        ) {
            const x =
                Phaser.Math.Between(
                    0,
                    5000
                );

            const y =
                Phaser.Math.Between(
                    0,
                    720
                );

            const line =
                this.add.line(
                    x,
                    y,
                    0,
                    0,
                    0,
                    14,
                    0x6da9c9,
                    0.35
                );

            line.setOrigin(0);

            line.setScrollFactor(
                Phaser.Math.FloatBetween(
                    0.4,
                    1
                )
            );

            this.rain.push(line);
        }
    }

    updateRain() {
        if (!this.rain) {
            return;
        }

        this.rain.forEach(
            drop => {
                drop.y += 9;

                if (
                    drop.y > 720
                ) {
                    drop.y = -20;
                }
            }
        );
    }

    // ======================================================
    // GAME OVER
    // ======================================================

    gameOver() {
        if (
            this.gameOverState
        ) {
            return;
        }

        this.gameOverState = true;

        this.physics.pause();

        this.showEndScreen(
            "TIMELINE COLLAPSED",
            "#ff5555",
            "Press R to restart"
        );
    }

    // ======================================================
    // VICTORY
    // ======================================================

    victory() {
        if (
            this.gameOverState
        ) {
            return;
        }

        this.gameOverState = true;

        this.physics.pause();

        this.showEndScreen(
            "EXTRACTION SUCCESSFUL",
            "#53d8ff",
            `Score: ${this.score}   Shards: ${this.shards}`
        );
    }

    showEndScreen(
        title,
        color,
        subtitle
    ) {
        const overlay =
            this.add.rectangle(
                this.scale.width / 2,
                this.scale.height / 2,
                this.scale.width,
                this.scale.height,
                0x000000,
                0.75
            );

        overlay.setScrollFactor(0);
        overlay.setDepth(3000);

        const titleText =
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 - 50,
                title,
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "42px",
                    fontStyle:
                        "bold",
                    color:
                        color,
                    stroke:
                        "#000000",
                    strokeThickness:
                        6
                }
            );

        titleText.setOrigin(0.5);

        titleText.setScrollFactor(0);
        titleText.setDepth(3001);

        const subText =
            this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 + 20,
                subtitle,
                {
                    fontFamily:
                        "Arial",
                    fontSize:
                        "20px",
                    color:
                        "#ffffff"
                }
            );

        subText.setOrigin(0.5);

        subText.setScrollFactor(0);
        subText.setDepth(3001);

        this.input.keyboard.once(
            "keydown-R",
            () => {
                this.scene.restart();
            }
        );
    }

    // ======================================================
    // UPDATE
    // ======================================================

    update() {
        if (
            this.gameOverState
        ) {
            return;
        }

        this.updatePlayer();
        this.updateEnemies();
        this.updateRain();

        // Slowly regenerate energy
        if (
            this.time.now % 30 < 1
        ) {
            this.energy =
                Math.min(
                    100,
                    this.energy + 1
                );

            this.updateHUD();
        }

        // Keep extraction animated
        if (
            this.extraction
        ) {
            this.extraction.setAlpha(
                0.15 +
                    Math.sin(
                        this.time.now /
                            250
                    ) *
                        0.1
            );
        }

        // Rotate shards
        if (
            this.shardsGroup
        ) {
            this.shardsGroup.children.iterate(
                shard => {
                    if (
                        shard &&
                        shard.active
                    ) {
                        shard.rotation +=
                            0.04;
                    }
                }
            );
        }
    }
}