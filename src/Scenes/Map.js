class Map extends Phaser.Scene {
    constructor() {
        super('map');
        this.DEBUG = false;
    }

    preload() {
        this.load.setPath('./assets/');
        this.load.image('tileset', 'visual/tileset.png');
        this.load.tilemapTiledJSON('tilemap', 'tilemap.tmj');

        TankBuilder.preload(this, 'medium', 'green');
    }

    create() {
        let map = this.make.tilemap({ key: 'tilemap' });
        let tileset = map.addTilesetImage('tileset', 'tileset');

        let ground = map.createLayer('Ground', tileset);
        let foreground = map.createLayer('Foreground', tileset);

        let spawnLayer = map.getObjectLayer('PlayerSpawn');
        let spawnObj = spawnLayer.objects[0];
        let spawnX = spawnObj.x + spawnObj.width / 2;
        let spawnY = spawnObj.y + spawnObj.height / 2;

        this.player = TankBuilder.build(this, 'medium', 'green', spawnX, spawnY);

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
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
        if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;

        this.player.move(vx, vy);

        let pointer = this.input.activePointer;
        let worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.player.aimTurretsAt(worldPoint.x, worldPoint.y);
    }
}
