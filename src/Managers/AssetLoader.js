class AssetLoader {
    static preload(scene, playerType, playerColor) {
        scene.load.setPath('./assets/');
        scene.load.image('tileset', 'visual/tileset.png');
        scene.load.tilemapTiledJSON('tilemap', 'tilemap.tmj');

        TankBuilder.preload(scene, playerType, playerColor);

        for (let i = 1; i <= 5; i++) {
            scene.load.image(`explosion${i}`, `visual/sprites/explosion${i}.png`);
        }
    }
}
