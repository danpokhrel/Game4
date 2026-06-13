class TitleScene extends Phaser.Scene {
    // Start screen — game title, controls info, buttons to play or view credits
    constructor() {
        super('title');
    }

    preload() {
        this.load.setPath('./assets/');
        this.load.image('titleButton', 'visual/ui/Blue/button_rectangle_flat.png');
        this.load.image('titleButtonHover', 'visual/ui/Green/button_rectangle_flat.png');
        this.load.image('iconPlay', 'visual/ui/Extra/icon_play_dark.png');
    }

    create() {
        let cx = this.cameras.main.centerX;
        let cy = this.cameras.main.centerY;

        let bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        this.add.text(cx, cy - 160, 'STEEL SKIRMISH', {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '64px',
            color: '#ffffff',
            stroke: '#444444',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(cx, cy - 90, 'A Top-Down Tank Arena Game', {
            fontFamily: 'Kenney Future Narrow, Arial',
            fontSize: '24px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        this.createButton(cx, cy + 20, 'PLAY', () => {
            this.scene.start('map');
        });

        this.createButton(cx, cy + 90, 'CREDITS', () => {
            this.scene.start('credits');
        });

        this.add.text(cx, cy + 170, 'WASD to move  |  Mouse to aim  |  Click to fire', {
            fontFamily: 'Kenney Future Narrow, Arial',
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        this.add.text(cx, cy + 200, 'ESC to pause  |  P for debug', {
            fontFamily: 'Kenney Future Narrow, Arial',
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);
    }

    // Create an interactive UI button with hover effect
    createButton(x, y, label, callback) {
        let btn = this.add.image(x, y, 'titleButton').setInteractive({ useHandCursor: true });
        btn.setScale(0.8, 0.55);

        let text = this.add.text(x, y, label, {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => {
            btn.setTexture('titleButtonHover');
            text.setColor('#ffffff');
        });
        btn.on('pointerout', () => {
            btn.setTexture('titleButton');
            text.setColor('#ffffff');
        });
        btn.on('pointerdown', callback);
    }
}
