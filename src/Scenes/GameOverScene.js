class GameOverScene extends Phaser.Scene {
    // Death screen — displays final score and wave reached, offers restart or credits
    constructor() {
        super('gameOver');
    }

    preload() {
        this.load.setPath('./assets/');
        this.load.image('goButton', 'visual/ui/Red/button_rectangle_flat.png');
        this.load.image('goButtonHover', 'visual/ui/Green/button_rectangle_flat.png');
    }

    create(data) {
        let cx = this.cameras.main.centerX;
        let cy = this.cameras.main.centerY;
        let score = data.score || 0;
        let wave = data.wave || 0;

        let bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        this.add.text(cx, cy - 120, 'GAME OVER', {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '64px',
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, cy - 40, 'Wave Reached: ' + wave, {
            fontFamily: 'Kenney Future Narrow, Arial',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(cx, cy, 'Enemies Destroyed: ' + score, {
            fontFamily: 'Kenney Future Narrow, Arial',
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.createButton(cx, cy + 80, 'RESTART', () => {
            this.scene.start('title');
        });

        this.createButton(cx, cy + 160, 'CREDITS', () => {
            this.scene.start('credits');
        });
    }

    createButton(x, y, label, callback) {
        let btn = this.add.image(x, y, 'goButton').setInteractive({ useHandCursor: true });
        btn.setScale(0.8, 0.55);

        let text = this.add.text(x, y, label, {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => {
            btn.setTexture('goButtonHover');
            text.setColor('#ffffff');
        });
        btn.on('pointerout', () => {
            btn.setTexture('goButton');
            text.setColor('#ffffff');
        });
        btn.on('pointerdown', callback);
    }
}
