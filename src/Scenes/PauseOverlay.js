class PauseOverlay extends Phaser.Scene {
    // Pause overlay — ESC to toggle, offers resume/restart/quit; pauses game and HUD while active
    constructor() {
        super('pause');
    }

    preload() {
        this.load.setPath('./assets/');
        this.load.image('pauseButton', 'visual/ui/Grey/button_rectangle_flat.png');
        this.load.image('pauseButtonHover', 'visual/ui/Green/button_rectangle_flat.png');
    }

    create() {
        let cx = this.cameras.main.centerX;
        let cy = this.cameras.main.centerY;

        let bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.6);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        this.add.text(cx, cy - 80, 'PAUSED', {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.createButton(cx, cy + 20, 'RESUME', () => {
            this.scene.resume('map');
            this.scene.resume('hud');
            this.scene.stop();
        });

        this.createButton(cx, cy + 100, 'RESTART', () => {
            this.scene.stop('hud');
            this.scene.stop('map');
            this.scene.start('map');
            this.scene.stop();
        });

        this.createButton(cx, cy + 180, 'QUIT', () => {
            this.scene.stop('hud');
            this.scene.stop('map');
            this.scene.start('title');
            this.scene.stop();
        });

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.resume('map');
            this.scene.resume('hud');
            this.scene.stop();
        });
    }

    createButton(x, y, label, callback) {
        let btn = this.add.image(x, y, 'pauseButton').setInteractive({ useHandCursor: true });
        btn.setScale(0.8, 0.55);

        let text = this.add.text(x, y, label, {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => {
            btn.setTexture('pauseButtonHover');
        });
        btn.on('pointerout', () => {
            btn.setTexture('pauseButton');
        });
        btn.on('pointerdown', callback);
    }
}
