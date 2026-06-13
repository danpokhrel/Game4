class EnemyController {
    constructor(scene, tankManager, bulletGroup, pathfinder) {
        this.scene = scene;
        this.tankManager = tankManager;
        this.bulletGroup = bulletGroup;
        this.pathfinder = pathfinder;
        this.enemies = [];
    }

    spawnFromLayer(enemySpawnLayer) {
        let spawnObjects = enemySpawnLayer.objects;

        for (let i = 0; i < ENEMY_DEFS.length; i++) {
            let def = ENEMY_DEFS[i];
            let spawnObj = spawnObjects[i % spawnObjects.length];

            let sx = spawnObj.x + Math.random() * spawnObj.width;
            let sy = spawnObj.y + Math.random() * spawnObj.height;

            let tank = TankBuilder.build(this.scene, def.bodyType, def.color, sx, sy);
            tank.isEnemy = true;
            tank.setCollisionCategory(ENEMY_TANK_CATEGORY);
            tank.setCollidesWith([WALL_CATEGORY, TANK_CATEGORY, ENEMY_TANK_CATEGORY, BULLET_CATEGORY]);
            this.tankManager.addTank(tank);

            let ai = new EnemyAI(this.scene, tank, this.bulletGroup, this.pathfinder);
            this.enemies.push({ tank: tank, ai: ai, color: PATH_COLORS[i % PATH_COLORS.length] });
        }
    }

    update(time, delta) {
        let player = this.tankManager.getPlayer();
        if (!player) return;

        if (this.pathfinder.pathGraphics) {
            this.pathfinder.clearPaths();
        }

        for (let i = 0; i < this.enemies.length; i++) {
            let entry = this.enemies[i];
            if (!entry.tank.active) continue;

            entry.ai.update(time, delta, player);

            if (this.pathfinder.pathGraphics && entry.ai.path && entry.ai.path.length > 1) {
                let drawPath = [{ x: entry.tank.x, y: entry.tank.y }].concat(entry.ai.path);
                this.pathfinder.drawPath(drawPath, entry.color);
            }
        }
    }

    setDebug(enabled) {
        this.pathfinder.setDebug(enabled);
    }

    getAliveCount() {
        let count = 0;
        for (let i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i].tank.active) count++;
        }
        return count;
    }
}
