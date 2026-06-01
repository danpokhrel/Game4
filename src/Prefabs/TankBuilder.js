class TankBuilder {
    static preload(scene, bodyType, color) {
        let basePath = 'visual/sprites/tank/';
        let bodyDefKey = `def_${bodyType}`;

        scene.load.json(bodyDefKey, `${basePath}tankBody_${bodyType}.json`);
        scene.load.image(`tankBody_${bodyType}_${color}`, `${basePath}tankBody_${bodyType}_${color}.png`);

        scene.load.once(`filecomplete-json-${bodyDefKey}`, () => {
            let bodyDef = scene.cache.json.get(bodyDefKey);
            bodyDef.turrets.forEach((t) => {
                scene.load.json(`def_${t.name}`, `${basePath}${t.name}.json`);
                scene.load.image(`${t.name}_${color}`, `${basePath}${t.name}_${color}.png`);
            });
        });
    }

    static build(scene, bodyType, color, x, y) {
        let bodyDef = scene.cache.json.get(`def_${bodyType}`);

        let config = {
            bodySpriteKey: `tankBody_${bodyType}_${color}`,
            speed: bodyDef.maxSpeed,
            maxHealth: bodyDef.maxHealth,
            turretSlots: bodyDef.turrets.map((t) => {
                let barrelDef = scene.cache.json.get(`def_${t.name}`);
                return {
                    turretConfig: {
                        spriteKey: `${t.name}_${color}`,
                        spriteOffsetX: -(barrelDef.socketX || 0),
                        spriteOffsetY: -(barrelDef.socketY || 0),
                        barrelEndX: (barrelDef.barrelX || 0) - (barrelDef.socketX || 0),
                        barrelEndY: (barrelDef.barrelY || 0) - (barrelDef.socketY || 0),
                        bulletKey: `${barrelDef.bullet}_${color}`,
                        shotKey: barrelDef.shot,
                        rotationOffset: SpriteFacing.DOWN,
                        bulletRotationOffset: SpriteFacing.UP,
                        depth: 1
                    },
                    socketX: t.socketX || 0,
                    socketY: t.socketY || 0
                };
            })
        };

        return new Tank(scene, x, y, config);
    }
}
