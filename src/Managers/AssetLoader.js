class AssetLoader {
    // Static preloader — loads tilemap, all tank body/barrel/bullet sprites, explosion animations, destructible sprites
    static preload(scene, playerType, playerColor) {
        scene.load.setPath('./assets/');
        scene.load.image('tileset', 'visual/tileset.png');
        scene.load.spritesheet('tilesetSprites', 'visual/tileset.png', { frameWidth: 128, frameHeight: 128 });
        scene.load.tilemapTiledJSON('tilemap', 'tilemap.tmj');
        scene.load.json('tilemapData', 'tilemap.tmj');

        TankBuilder.preload(scene, playerType, playerColor);

        for (let i = 0; i < ENEMY_DEFS.length; i++) {
            let def = ENEMY_DEFS[i];
            if (def.bodyType !== playerType || def.color !== playerColor) {
                TankBuilder.preload(scene, def.bodyType, def.color);
            }
        }

        for (let i = 1; i <= 5; i++) {
            scene.load.image(`explosion${i}`, `visual/sprites/explosion${i}.png`);
            scene.load.image(`explosionSmoke${i}`, `visual/sprites/explosionSmoke${i}.png`);
        }

        scene.load.image('oilSpill_small', 'visual/sprites/oilSpill_small.png');
        scene.load.image('oilSpill_large', 'visual/sprites/oilSpill_large.png');
    }
}
