class TankBuilder {
    static preload(scene, bodyType, color) {
        let spritePath = 'visual/sprites/tank/';
        let descPath = 'descriptors/';
        let bodyDefKey = `def_${bodyType}`;

        let bodyDefCached = scene.cache.json.has(bodyDefKey);
        scene.load.json(bodyDefKey, `${descPath}tankBody_${bodyType}.json`);
        scene.load.image(`tankBody_${bodyType}_${color}`, `${spritePath}tankBody_${bodyType}_${color}.png`);

        let loadBarrels = (bodyDef) => {
            let uniqueNames = [...new Set(bodyDef.turrets.map(t => t.name))];
            uniqueNames.forEach((name) => {
                let barrelKey = `def_${name}`;
                let barrelDefCached = scene.cache.json.has(barrelKey);
                scene.load.json(barrelKey, `${descPath}${name}.json`);
                scene.load.image(`${name}_${color}`, `${spritePath}${name}_${color}.png`);

                let loadBarrelBullets = (barrelDef) => {
                    scene.load.image(`${barrelDef.bullet}_${color}`, `${spritePath}${barrelDef.bullet}_${color}.png`);
                    scene.load.image(barrelDef.shot, `visual/sprites/${barrelDef.shot}.png`);
                };

                if (barrelDefCached) {
                    loadBarrelBullets(scene.cache.json.get(barrelKey));
                } else {
                    scene.load.once(`filecomplete-json-${barrelKey}`, () => {
                        loadBarrelBullets(scene.cache.json.get(barrelKey));
                    });
                }
            });
        };

        if (bodyDefCached) {
            loadBarrels(scene.cache.json.get(bodyDefKey));
        } else {
            scene.load.once(`filecomplete-json-${bodyDefKey}`, () => {
                loadBarrels(scene.cache.json.get(bodyDefKey));
            });
        }
    }

    static build(scene, bodyType, color, x, y) {
        let bodyDef = scene.cache.json.get(`def_${bodyType}`);

        let config = {
            bodySpriteKey: `tankBody_${bodyType}_${color}`,
            speed: bodyDef.maxSpeed,
            acceleration: bodyDef.acceleration || null,
            maxHealth: bodyDef.maxHealth,
            turretSlots: bodyDef.turrets.map((t) => {
                let barrelDef = scene.cache.json.get(`def_${t.name}`);
                let flipX = t.flipX || false;
                let socketXSign = flipX ? -1 : 1;
                return {
                    turretConfig: {
                        spriteKey: `${t.name}_${color}`,
                        spriteOffsetX: socketXSign * -(barrelDef.socketX || 0),
                        spriteOffsetY: -(barrelDef.socketY || 0),
                        barrelEndX: socketXSign * ((barrelDef.barrelX || 0) - (barrelDef.socketX || 0)),
                        barrelEndY: (barrelDef.barrelY || 0) - (barrelDef.socketY || 0),
                        angleLimit: barrelDef.angleLimit != null ? Phaser.Math.DegToRad(barrelDef.angleLimit) : null,
                        flipX: flipX,
                        bulletKey: `${barrelDef.bullet}_${color}`,
                        shotKey: barrelDef.shot,
                        bulletSpeed: barrelDef.bulletSpeed || 400,
                        reloadTime: barrelDef.reloadTime || 1,
                        rotationOffset: barrelDef.rotationOffset != null ? barrelDef.rotationOffset : SpriteFacing.DOWN,
                        bulletRotationOffset: barrelDef.bulletRotationOffset != null ? barrelDef.bulletRotationOffset : SpriteFacing.UP,
                        damage: barrelDef.damage || 10,
                        depth: barrelDef.depth || 1
                    },
                    socketX: t.socketX || 0,
                    socketY: t.socketY || 0
                };
            })
        };

        return new Tank(scene, x, y, config);
    }
}