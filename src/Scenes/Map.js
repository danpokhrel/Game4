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

        this.colliders = this.buildColliders(map);

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
        this.tankManager = new TankManager(this, this.colliders, this.bulletGroup);

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
        let colliders = this.physics.add.staticGroup();
        collisionObjects.forEach((obj) => {
            let rect = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
            this.physics.add.existing(rect, true);
            colliders.add(rect);
            rect.setVisible(false);
        });
        return colliders;
    }

    setupDebug() {
        this.input.keyboard.on('keydown-P', () => {
            this.DEBUG = !this.DEBUG;
            this.physics.world.drawDebug = this.DEBUG;
            this.physics.world.debugGraphic.clear();
            this.physics.world.debugGraphic.setVisible(this.DEBUG);
            this.tankManager.getPlayer().setDebug(this.DEBUG);
        });

        this.physics.world.drawDebug = false;
        this.physics.world.debugGraphic.setVisible(false);
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
