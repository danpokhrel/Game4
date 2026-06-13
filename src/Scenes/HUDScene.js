class HUDScene extends Phaser.Scene {
    // Overlay scene running in parallel — health bar, score counter, wave indicator, wave announcements
    constructor() {
        super('hud');
    }

    create() {
        this.score = 0;
        this.wave = 1;

        let cam = this.cameras.main;
        let w = cam.width;
        let h = cam.height;

        this.healthBarBg = this.add.graphics();
        this.healthBarBg.fillStyle(0x333333, 1);
        this.healthBarBg.fillRect(16, 16, 200, 20);
        this.healthBarBg.setScrollFactor(0);
        this.healthBarBg.setDepth(100);

        this.healthBarFill = this.add.graphics();
        this.healthBarFill.setScrollFactor(0);
        this.healthBarFill.setDepth(101);

        this.healthText = this.add.text(16, 18, '', {
            fontFamily: 'Kenney Future Narrow, Arial',
            fontSize: '14px',
            color: '#ffffff'
        }).setScrollFactor(0).setDepth(102);

        this.scoreText = this.add.text(w - 16, 18, 'Score: 0', {
            fontFamily: 'Kenney Future Narrow, Arial',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(102);

        this.waveText = this.add.text(w / 2, 18, 'Wave 1', {
            fontFamily: 'Kenney Future Narrow, Arial',
            fontSize: '18px',
            color: '#ffcc00'
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102);

        this.waveAnnounce = this.add.text(w / 2, h / 2, '', {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '48px',
            color: '#ffcc00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(103).setAlpha(0);

        this.updateHealthBar(1);

        this.gameScene = this.scene.get('map');

        this.gameScene.events.on('playerHealthChanged', (ratio) => {
            this.updateHealthBar(ratio);
        });

        this.gameScene.events.on('enemyDestroyed', () => {
            this.score++;
            this.scoreText.setText('Score: ' + this.score);
        });

        this.gameScene.events.on('waveStarted', (wave) => {
            this.wave = wave;
            this.waveText.setText('Wave ' + wave);
            this.showWaveAnnounce(wave);
        });
    }

    // Update health bar fill color (green→yellow→red) based on health ratio
    updateHealthBar(ratio) {
        this.healthBarFill.clear();
        let color = ratio > 0.5 ? 0x44cc44 : (ratio > 0.25 ? 0xcccc44 : 0xcc4444);
        this.healthBarFill.fillStyle(color, 1);
        this.healthBarFill.fillRect(16, 16, 200 * ratio, 20);
        this.healthText.setText(Math.round(ratio * 100) + '%');
    }

    // Show wave number announcement that fades out over 2 seconds
    showWaveAnnounce(wave) {
        this.waveAnnounce.setText('WAVE ' + wave);
        this.waveAnnounce.setAlpha(1);
        this.tweens.add({
            targets: this.waveAnnounce,
            alpha: 0,
            duration: 2000,
            delay: 1000,
            ease: 'Power2'
        });
    }

    getScore() {
        return this.score;
    }
}
