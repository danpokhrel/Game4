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

        this.mapBounds = new Phaser.Geom.Rectangle(0, 0, map.widthInPixels, map.heightInPixels);

        this.buildColliders(map);

        this.anims.create({
            key: 'explosion',
            frames: [1, 2, 3, 4, 5].map(i => ({ key: `explosion${i}` })),
            frameRate: 20,
            hideOnComplete: true
        });

        this.events.on('bulletimpact', (x, y) => {
            let explosion = this.add.sprite(x, y, 'explosion1').play('explosion').setDepth(3);
            explosion.on('animationcomplete', () => explosion.destroy());
        });

        this.bulletGroup = new BulletGroup(this);
        this.setupBulletWallCollision();

        this.tankManager = new TankManager(this, this.bulletGroup);

        let spawnLayer = map.getObjectLayer('PlayerSpawn');
        let spawnObj = spawnLayer.objects[0];
        let spawnX = spawnObj.x + spawnObj.width / 2;
        let spawnY = spawnObj.y + spawnObj.height / 2;

        let playerTank = this.tankManager.addTank(TankBuilder.build(this, 'medium', 'dark', spawnX, spawnY));
        this.playerController = new PlayerController(this, playerTank, this.bulletGroup);

        this.setupDebug();
        this.setupCamera(playerTank, spawnX, spawnY);
    }

    update() {
        this.playerController.update();
        this.tankManager.update();
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
                    mask: TANK_CATEGORY | BULLET_CATEGORY
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

    setupBulletWallCollision() {
        this.matter.world.on('collisionstart', (event) => {
            for (let i = 0; i < event.pairs.length; i++) {
                let pair = event.pairs[i];
                let bodyA = pair.bodyA;
                let bodyB = pair.bodyB;

                let bullet = null;
                if (bodyA.gameObject && bodyA.gameObject instanceof Bullet) {
                    bullet = bodyA.gameObject;
                } else if (bodyB.gameObject && bodyB.gameObject instanceof Bullet) {
                    bullet = bodyB.gameObject;
                }

                if (bullet && bullet.active) {
                    let x = bullet.x;
                    let y = bullet.y;
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
