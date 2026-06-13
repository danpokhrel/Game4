class Map extends Phaser.Scene {
    // Main gameplay scene — tilemap, collisions, player/enemy tanks, wave progression, bullet damage, game over
    constructor() {
        super('map');
        this.DEBUG = false;
    }

    preload() {
        this.load.setPath('./assets/');
        AssetLoader.preload(this, 'medium', 'dark');

        this.load.image('oilSmall', 'visual/sprites/oilSpill_small.png');
        this.load.image('oilLarge', 'visual/sprites/oilSpill_large.png');
    }

    create() {
        this.score = 0;
        this.gameOver = false;

        this.events.off('playerHealthChanged');
        this.events.off('enemyDestroyed');
        this.events.off('waveStarted');
        this.events.off('bulletimpact');
        this.events.off('tankdestroyed');
        this.events.off('obstacleDestroyed');

        if (this.scene.isActive('hud')) {
            this.scene.stop('hud');
        }

        this.buildTilemap();
        this.buildColliders();
        this.setupPathfinder();
        this.setupExplosionAnimations();
        this.setupBulletCollisions();
        this.setupPlayer();
        this.setupEnemies();
        this.setupObstacles();
        this.setupPause();
        this.setupDebug();
        this.setupCamera(this.playerTank);

        this.gameFeedback = new GameFeedback(this);

        this.scene.launch('hud');
    }

    update() {
        if (this.gameOver) return;

        this.playerController.update();
        this.tankManager.update();
        this.enemyController.update(this.time.now, this.sys.game.loop.delta);
        this.waveManager.update();
    }

    // Build the Tiled tilemap, create Ground/Foreground layers, and compute world bounds from infinite map chunks
    buildTilemap() {
        let map = this.make.tilemap({ key: 'tilemap' });
        let tileset = map.addTilesetImage('tileset', 'tileset');
        map.createLayer('Ground', tileset);
        map.createLayer('Foreground', tileset);

        let tmjData = this.cache.json.get('tilemapData');
        let groundLayerDef = tmjData.layers.find(function (l) { return l.name === 'Ground'; });
        let chunks = groundLayerDef.chunks;
        let minTileX = Infinity, minTileY = Infinity;
        let maxTileX = -Infinity, maxTileY = -Infinity;
        for (let i = 0; i < chunks.length; i++) {
            let c = chunks[i];
            if (c.x < minTileX) minTileX = c.x;
            if (c.y < minTileY) minTileY = c.y;
            if (c.x + c.width > maxTileX) maxTileX = c.x + c.width;
            if (c.y + c.height > maxTileY) maxTileY = c.y + c.height;
        }
        this.worldX = minTileX * map.tileWidth;
        this.worldY = minTileY * map.tileHeight;
        this.worldWidth = (maxTileX - minTileX) * map.tileWidth;
        this.worldHeight = (maxTileY - minTileY) * map.tileHeight;

        this.tilemap = map;
        this.collisionObjects = map.getObjectLayer('Collision').objects;
    }

    // Create static Matter colliders from the Collision object layer (ellipses, polygons, rectangles)
    buildColliders() {
        this.collisionObjects.forEach((obj) => {
            let cx = obj.x + obj.width / 2;
            let cy = obj.y + obj.height / 2;
            let opts = {
                isStatic: true,
                collisionFilter: {
                    category: WALL_CATEGORY,
                    mask: TANK_CATEGORY | ENEMY_TANK_CATEGORY | BULLET_CATEGORY
                }
            };

            if (obj.ellipse) {
                if (obj.width === obj.height) {
                    this.matter.add.circle(cx, cy, obj.width / 2, opts);
                } else {
                    let verts = [];
                    let steps = 16;
                    for (let i = 0; i < steps; i++) {
                        let angle = (i / steps) * Math.PI * 2;
                        verts.push({
                            x: cx + (obj.width / 2) * Math.cos(angle),
                            y: cy + (obj.height / 2) * Math.sin(angle)
                        });
                    }
                    this.matter.add.fromVertices(cx, cy, verts, opts);
                }
            } else if (obj.polygon) {
                let verts = obj.polygon.map(v => ({ x: obj.x + v.x, y: obj.y + v.y }));
                this.matter.add.fromVertices(cx, cy, verts, opts);
            } else if (obj.point) {
                return;
            } else {
                this.matter.add.rectangle(cx, cy, obj.width, obj.height, opts);
            }
        });
    }

    // Initialize A* pathfinder grid from collision shapes for enemy navigation
    setupPathfinder() {
        let pathObjects = this.collisionObjects.slice();
        let indestructLayer = this.tilemap.getObjectLayer('Indestructibles');
        if (indestructLayer) {
            indestructLayer.objects.forEach((obj) => { pathObjects.push(obj); });
        }
        this.pathfinder = new Pathfinder(this, pathObjects, this.worldX, this.worldY, this.worldWidth, this.worldHeight, 128);
    }

    // Define explosion sprite animations and event handlers for bullet/tank/obstacle destruction effects
    setupExplosionAnimations() {
        if (!this.anims.exists('explosion')) {
            this.anims.create({
                key: 'explosion',
                frames: [1, 2, 3, 4, 5].map(i => ({ key: `explosion${i}` })),
                frameRate: 20,
                hideOnComplete: true
            });
        }

        if (!this.anims.exists('smokeExplosion')) {
            this.anims.create({
                key: 'smokeExplosion',
                frames: [1, 2, 3, 4, 5].map(i => ({ key: `explosionSmoke${i}` })),
                frameRate: 20,
                hideOnComplete: true
            });
        }

        this.events.on('bulletimpact', (x, y) => {
            let explosion = this.add.sprite(x, y, 'explosion1').play('explosion').setDepth(3).setScale(0.8);
            explosion.on('animationcomplete', () => explosion.destroy());
        });

        this.events.on('tankdestroyed', (x, y, tank) => {
            let explosion = this.add.sprite(x, y, 'explosionSmoke1').play('smokeExplosion').setDepth(3).setScale(1.5);
            explosion.on('animationcomplete', () => explosion.destroy());

            if (tank && tank.isEnemy) {
                this.score++;
                this.events.emit('enemyDestroyed');
            }
            if (tank && !tank.isEnemy) {
                this.triggerGameOver();
            }
        });

        this.events.on('obstacleDestroyed', () => {});
    }

    // Matter collision callback — detect bullet hits on tanks (damage + flash + shake) and destructible obstacles
    setupBulletCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            for (let i = 0; i < event.pairs.length; i++) {
                let pair = event.pairs[i];
                let bodyA = pair.bodyA;
                let bodyB = pair.bodyB;

                let bullet = null;
                let hitTarget = null;

                if (bodyA.gameObject && bodyA.gameObject instanceof Bullet) {
                    bullet = bodyA.gameObject;
                    hitTarget = bodyB.gameObject;
                } else if (bodyB.gameObject && bodyB.gameObject instanceof Bullet) {
                    bullet = bodyB.gameObject;
                    hitTarget = bodyA.gameObject;
                }

                if (bullet && bullet.active) {
                    let x = bullet.x;
                    let y = bullet.y;

                    if (hitTarget && hitTarget instanceof Tank && hitTarget.active) {
                        hitTarget.damage(bullet.damage);
                        this.gameFeedback.flashOnHit(hitTarget);

                        if (!hitTarget.isEnemy) {
                            this.gameFeedback.shakeOnPlayerHit();
                            let ratio = hitTarget.health / hitTarget.maxHealth;
                            this.events.emit('playerHealthChanged', ratio);
                        }
                    } else if (hitTarget && hitTarget instanceof DestructibleObstacle && hitTarget.active) {
                        hitTarget.damage(bullet.damage);
                    }

                    bullet.destroy();
                    this.events.emit('bulletimpact', x, y);
                }
            }
        });
    }

    // Create player tank at PlayerSpawn, double health/turret damage for survivability, init PlayerController
    setupPlayer() {
        this.bulletGroup = new BulletGroup(this);
        this.tankManager = new TankManager(this, this.bulletGroup);

        let spawnLayer = this.tilemap.getObjectLayer('PlayerSpawn');
        let spawnObj = spawnLayer.objects[0];
        let spawnX = spawnObj.x + spawnObj.width / 2;
        let spawnY = spawnObj.y + spawnObj.height / 2;

        this.playerTank = this.tankManager.addTank(TankBuilder.build(this, 'medium', 'dark', spawnX, spawnY));
        this.playerTank.maxHealth *= 2;
        this.playerTank.health = this.playerTank.maxHealth;
        this.playerTank.turretEntries.forEach((entry) => { entry.turret.damage *= 2; });
        this.playerController = new PlayerController(this, this.playerTank, this.bulletGroup);

        this.events.emit('playerHealthChanged', 1);
    }

    // Initialize EnemyController and WaveManager for escalating wave-based enemy spawning
    setupEnemies() {
        this.enemyController = new EnemyController(this, this.tankManager, this.bulletGroup, this.pathfinder);

        let enemySpawnLayer = this.tilemap.getObjectLayer('EnemySpawn');
        let spawnAreas = enemySpawnLayer.objects.map(obj => ({
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height
        }));

        this.waveManager = new WaveManager(this, this.enemyController, spawnAreas);
    }

    // Create destructible and indestructible obstacle objects from tilemap object layers
    setupObstacles() {
        let FIRST_GID = 1;

        this.destructibles = [];
        let destructLayer = this.tilemap.getObjectLayer('Destructibles');
        if (destructLayer) {
            destructLayer.objects.forEach((obj) => {
                let frame = (obj.gid || 0) - FIRST_GID;
                let cx = obj.x + obj.width / 2;
                let cy = obj.y + obj.height / 2;
                let obstacle = new DestructibleObstacle(this, cx, cy, 'tilesetSprites', frame, {
                    maxHealth: 1,
                    depth: 0,
                    rotation: Phaser.Math.DegToRad(obj.rotation || 0)
                });
                this.destructibles.push(obstacle);
            });
        }

        this.indestructibles = [];
        let indestructLayer = this.tilemap.getObjectLayer('Indestructibles');
        if (indestructLayer) {
            indestructLayer.objects.forEach((obj) => {
                let frame = (obj.gid || 0) - FIRST_GID;
                let cx = obj.x + obj.width / 2;
                let cy = obj.y + obj.height / 2;
                let rotRad = Phaser.Math.DegToRad(obj.rotation || 0);

                let sprite = this.add.image(cx, cy, 'tilesetSprites', frame);
                sprite.setOrigin(0.5);
                sprite.setRotation(rotRad);
                sprite.setDepth(0);

                this.matter.add.rectangle(cx, cy, obj.width, obj.height, {
                    isStatic: true,
                    angle: rotRad,
                    collisionFilter: {
                        category: WALL_CATEGORY,
                        mask: TANK_CATEGORY | ENEMY_TANK_CATEGORY | BULLET_CATEGORY
                    }
                });

                this.indestructibles.push(sprite);
            });
        }
    }

    // ESC key pauses game scene and HUD, launches PauseOverlay for resume/restart/quit
    setupPause() {
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.gameOver) return;
            this.scene.pause();
            this.scene.pause('hud');
            this.scene.launch('pause');
        });
    }

    // When player dies, delay 2s for explosion, then transition to GameOverScene with score/wave data
    triggerGameOver() {
        this.gameOver = true;
        this.cameras.main.stopFollow();

        let hudScene = this.scene.get('hud');
        let score = hudScene ? hudScene.getScore() : this.score;
        let wave = this.waveManager.getCurrentWave();

        this.time.delayedCall(2000, () => {
            this.scene.stop('hud');
            this.scene.start('gameOver', { score: score, wave: wave });
        });
    }

    // P key toggles Matter debug rendering, turret debug graphics, and pathfinder grid visualization
    setupDebug() {
        this.input.keyboard.on('keydown-P', () => {
            this.DEBUG = !this.DEBUG;
            this.matter.world.drawDebug = this.DEBUG;
            if (!this.DEBUG) this.matter.world.debugGraphic.clear();
            this.matter.world.debugGraphic.setVisible(this.DEBUG);
            let player = this.tankManager.getPlayer();
            if (player && player.active) player.setDebug(this.DEBUG);
            this.enemyController.setDebug(this.DEBUG);
        });

        this.matter.world.drawDebug = false;
        this.matter.world.debugGraphic.setVisible(false);
    }

    // Set camera zoom to fit 16-tile width, follow player tank with smooth lerp
    setupCamera(target) {
        let TILE_SIZE = 128;
        let cameraWorldWidth = 16 * TILE_SIZE;
        let zoom = this.cameras.main.width / cameraWorldWidth * 0.8;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.startFollow(target, true, 0.1, 0.1);
        this.cameras.main.centerOn(target.x, target.y);
    }
}
