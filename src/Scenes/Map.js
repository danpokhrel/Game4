class Map extends Phaser.Scene {
    constructor() {
        super('map');
    }

    preload() {
        this.load.setPath('./assets/');
        this.load.image('tileset', 'visual/tileset.png');
        this.load.tilemapTiledJSON('tilemap', 'tilemap.tmj');
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

        let player = this.add.rectangle(spawnX, spawnY, 64, 64, 0xff0000);

        let TILE_SIZE = 128;
        let cameraWorldWidth = 16 * TILE_SIZE;
        let zoom = this.cameras.main.width / cameraWorldWidth;
        this.cameras.main.setZoom(zoom);
        this.cameras.main.centerOn(spawnX, spawnY);
    }
}
