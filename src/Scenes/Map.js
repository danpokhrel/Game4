class Map extends Phaser.Scene {
    constructor() {
        super('map');
        this.DEBUG = false;
    }

    preload() {
        this.load.setPath('./assets/');
        this.load.image('tileset', 'visual/tileset.png');
        this.load.tilemapTiledJSON('tilemap', 'tilemap.tmj');

        TankBuilder.preload(this, 'large', 'dark');

        for (let i = 1; i <= 5; i++) {
            this.load.image(`explosion${i}`, `visual/sprites/explosion${i}.png`);
        }
    }

    create() {
        let map = this.make.tilemap({ key: 'tilemap' });
        let tileset = map.addTilesetImage('tileset', 'tileset');

        let ground = map.createLayer('Ground', tileset);
        let foreground = map.createLayer('Foreground', tileset);

        this.mapBounds = new Phaser.Geom.Rectangle(0, 0, map.widthInPixels, map.heightInPixels);

        let spawnLayer = map.getObjectLayer('PlayerSpawn');
        let spawnObj = spawnLayer.objects[0];
        let spawnX = spawnObj.x + spawnObj.width / 2;
        let spawnY = spawnObj.y + spawnObj.height / 2;

        this.player = TankBuilder.build(this, 'large', 'dark', spawnX, spawnY);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        let collisionObjects = map.getObjectLayer('Collision').objects;
        this.colliders = this.physics.add.staticGroup();
        collisionObjects.forEach((obj) => {
            let rect = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
            this.physics.add.existing(rect, true);
            this.colliders.add(rect);
            rect.setVisible(false);
        });
        this.physics.add.collider(this.player, this.colliders);

        this.bullets = this.physics.add.group({ allowGravity: false });
        this.anims.create({
            key: 'explosion',
            frames: [1, 2, 3, 4, 5].map(i => ({ key: `explosion${i}` })),
            frameRate: 20,
            hideOnComplete: true
        });

        this.physics.add.collider(this.bullets, this.colliders, (bullet) => {
            let x = bullet.x;
            let y = bullet.y;
            bullet.destroy();
            let explosion = this.add.sprite(x, y, 'explosion1').play('explosion').setDepth(3);
            explosion.on('animationcomplete', () => explosion.destroy());
        });

        this.input.on('pointerdown', () => {
            this.player.fire(this.bullets);
        });

        this.input.keyboard.on('keydown-P', () => {
            this.DEBUG = !this.DEBUG;
            this.physics.world.drawDebug = this.DEBUG;
            this.physics.world.debugGraphic.clear();
            this.physics.world.debugGraphic.setVisible(this.DEBUG);
            this.player.setDebug(this.DEBUG);
        });

        this.physics.world.drawDebug = false;
        this.physics.world.debugGraphic.setVisible(false);

        let TILE_SIZE = 128;
        let cameraWorldWidth = 16 * TILE_SIZE;
        let zoom = this.cameras.main.width / cameraWorldWidth;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.centerOn(spawnX, spawnY);
    }

    update() {
        let accel = 0;
        let turn = 0;

        if (this.wasd.up.isDown || this.cursors.up.isDown) accel += 1;
        if (this.wasd.down.isDown || this.cursors.down.isDown) accel -= 1;
        if (this.wasd.left.isDown || this.cursors.left.isDown) turn -= 1;
        if (this.wasd.right.isDown || this.cursors.right.isDown) turn += 1;

        this.player.move(accel, turn);

        let pointer = this.input.activePointer;
        let worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.aimTurretsAt(worldPoint.x, worldPoint.y);

        this.bullets.children.each((bullet) => {
            if (bullet.active && !this.mapBounds.contains(bullet.x, bullet.y)) {
                bullet.destroy();
            }
        });
    }
}
