class Map extends Phaser.Scene {
    constructor() {
        super('map');
        this.DEBUG = false;
    }

    preload() {
        AssetLoader.preload(this, 'medium', 'dark');
    }

    create() {
        let map = this.make.tilemap({ key: 'tilemap' });
        let tileset = map.addTilesetImage('tileset', 'tileset');

        map.createLayer('Ground', tileset);
        map.createLayer('Foreground', tileset);

        let tmjData = this.cache.json.get('tilemapData');
        let groundLayerDef = tmjData.layers.find(function(l) { return l.name === 'Ground'; });
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
        let worldX = minTileX * map.tileWidth;
        let worldY = minTileY * map.tileHeight;
        let worldWidth = (maxTileX - minTileX) * map.tileWidth;
        let worldHeight = (maxTileY - minTileY) * map.tileHeight;

        this.mapBounds = new Phaser.Geom.Rectangle(worldX, worldY, worldWidth, worldHeight);

        let collisionObjects = map.getObjectLayer('Collision').objects;
        this.buildColliders(map);

        this.pathfinder = new Pathfinder(this, collisionObjects, worldX, worldY, worldWidth, worldHeight, 128);

        this.anims.create({
            key: 'explosion',
            frames: [1, 2, 3, 4, 5].map(i => ({ key: `explosion${i}` })),
            frameRate: 20,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'smokeExplosion',
            frames: [1, 2, 3, 4, 5].map(i => ({ key: `explosionSmoke${i}` })),
            frameRate: 20,
            hideOnComplete: true
        });

        this.events.on('bulletimpact', (x, y) => {
            let explosion = this.add.sprite(x, y, 'explosion1').play('explosion').setDepth(3).setScale(0.8);
            explosion.on('animationcomplete', () => explosion.destroy());
        });

        this.events.on('tankdestroyed', (x, y) => {
            let explosion = this.add.sprite(x, y, 'explosionSmoke1').play('smokeExplosion').setDepth(3).setScale(1.5);
            explosion.on('animationcomplete', () => explosion.destroy());
        });

        this.bulletGroup = new BulletGroup(this);
        this.setupBulletCollisions();

        this.tankManager = new TankManager(this, this.bulletGroup);

        let spawnLayer = map.getObjectLayer('PlayerSpawn');
        let spawnObj = spawnLayer.objects[0];
        let spawnX = spawnObj.x + spawnObj.width / 2;
        let spawnY = spawnObj.y + spawnObj.height / 2;

        let playerTank = this.tankManager.addTank(TankBuilder.build(this, 'medium', 'dark', spawnX, spawnY));
        playerTank.maxHealth *= 2;
        playerTank.health = playerTank.maxHealth;
        playerTank.turretEntries.forEach((entry) => { entry.turret.damage *= 2; });
        this.playerController = new PlayerController(this, playerTank, this.bulletGroup);

        this.enemyController = new EnemyController(this, this.tankManager, this.bulletGroup, this.pathfinder);
        let enemySpawnLayer = map.getObjectLayer('enemySpawn');
        if (enemySpawnLayer) {
            this.enemyController.spawnFromLayer(enemySpawnLayer);
        }

        this.setupDebug();
        this.setupCamera(playerTank, spawnX, spawnY);
    }

    update() {
        this.playerController.update();
        this.tankManager.update();
        this.enemyController.update(this.time.now, this.sys.game.loop.delta);
    }

    buildColliders(map) {
        let collisionObjects = map.getObjectLayer('Collision').objects;
        collisionObjects.forEach((obj) => {
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

    setupBulletCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            for (let i = 0; i < event.pairs.length; i++) {
                let pair = event.pairs[i];
                let bodyA = pair.bodyA;
                let bodyB = pair.bodyB;

                let bullet = null;
                let tank = null;

                if (bodyA.gameObject && bodyA.gameObject instanceof Bullet) {
                    bullet = bodyA.gameObject;
                    if (bodyB.gameObject && bodyB.gameObject instanceof Tank) {
                        tank = bodyB.gameObject;
                    }
                } else if (bodyB.gameObject && bodyB.gameObject instanceof Bullet) {
                    bullet = bodyB.gameObject;
                    if (bodyA.gameObject && bodyA.gameObject instanceof Tank) {
                        tank = bodyA.gameObject;
                    }
                }

                if (bullet && bullet.active) {
                    let x = bullet.x;
                    let y = bullet.y;
                    if (tank && tank.active) {
                        tank.damage(bullet.damage);
                    }
                    bullet.destroy();
                    this.events.emit('bulletimpact', x, y);
                }
            }
        });
    }

    setupDebug() {
        this.input.keyboard.on('keydown-P', () => {
            this.DEBUG = !this.DEBUG;
            this.matter.world.drawDebug = this.DEBUG;
            if (!this.DEBUG) this.matter.world.debugGraphic.clear();
            this.matter.world.debugGraphic.setVisible(this.DEBUG);
            this.tankManager.getPlayer().setDebug(this.DEBUG);
            this.enemyController.setDebug(this.DEBUG);
        });

        this.matter.world.drawDebug = false;
        this.matter.world.debugGraphic.setVisible(false);
    }

    setupCamera(target, x, y) {
        let TILE_SIZE = 128;
        let cameraWorldWidth = 16 * TILE_SIZE;
        let zoom = this.cameras.main.width / cameraWorldWidth;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.startFollow(target, true, 0.1, 0.1);
        this.cameras.main.centerOn(x, y);
    }
}
