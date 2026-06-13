class WaveManager {
    // Escalating wave spawner — each wave adds more enemies; wave completion detected when all enemies are destroyed
    constructor(scene, enemyController, spawnAreas) {
        this.scene = scene;
        this.enemyController = enemyController;
        this.spawnAreas = spawnAreas;
        this.currentWave = 0;
        this.isWaveActive = false;
        this.waveStartDelay = 3000;
        this.waveTransitionTimer = null;

        this.startNextWave();
    }

    // Begin next wave with delay, emit waveStarted event for HUD announcement
    startNextWave() {
        this.currentWave++;
        this.isWaveActive = false;

        this.scene.events.emit('waveStarted', this.currentWave);

        this.waveTransitionTimer = this.scene.time.delayedCall(this.waveStartDelay, () => {
            this.spawnWave();
            this.isWaveActive = true;
        });
    }

    // Scale enemy count with wave number; introduce tougher types in later waves
    getWaveEnemyCount(wave) {
        return Math.min(wave + 1, 8) + Math.floor(wave / 2);
    }

    // Select enemy definition from ENEMY_DEFS pool — early waves use scouts, later waves add heavies
    getWaveEnemyDef(wave, index) {
        if (wave <= 2) {
            return ENEMY_DEFS[index % 1];
        } else if (wave <= 5) {
            return ENEMY_DEFS[index % 2];
        } else {
            return ENEMY_DEFS[index % ENEMY_DEFS.length];
        }
    }

    // Spawn all enemies for current wave across spawn areas
    spawnWave() {
        let total = this.getWaveEnemyCount(this.currentWave);

        for (let i = 0; i < total; i++) {
            let def = this.getWaveEnemyDef(this.currentWave, i);
            let spawnArea = this.spawnAreas[i % this.spawnAreas.length];
            let sx = spawnArea.x + Math.random() * spawnArea.width;
            let sy = spawnArea.y + Math.random() * spawnArea.height;

            this.enemyController.spawnEnemy(def.bodyType, def.color, sx, sy);
        }
    }

    // Check if wave is complete (all enemies destroyed) and trigger next wave
    update() {
        if (this.isWaveActive && this.enemyController.getAliveCount() === 0) {
            this.isWaveActive = false;
            this.startNextWave();
        }
    }

    getCurrentWave() {
        return this.currentWave;
    }

    destroy() {
        if (this.waveTransitionTimer) {
            this.waveTransitionTimer.remove();
        }
    }
}
