class CreditsScene extends Phaser.Scene {
    // Credits screen — lists developer and asset attributions, back button to title
    constructor() {
        super('credits');
    }

    preload() {
        this.load.setPath('./assets/');
        this.load.image('creditsButton', 'visual/ui/Grey/button_rectangle_flat.png');
        this.load.image('creditsButtonHover', 'visual/ui/Green/button_rectangle_flat.png');
    }

    create() {
        let cx = this.cameras.main.centerX;
        let cy = this.cameras.main.centerY;

        let bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        this.add.text(cx, cy - 180, 'CREDITS', {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#444444',
            strokeThickness: 3
        }).setOrigin(0.5);

        let credits = [
            'Steel Skirmish',
            '',
            'Developer',
            'Dan Pokhrel',
            '',
            'Assets',
            'Kenney - Top-down Tanks Remastered Pack',
            'Kenney - UI Pack',
            'Kenney - Impact Audio Pack'
        ];

        let startY = cy - 110;
        for (let i = 0; i < credits.length; i++) {
            let isHeader = credits[i] === 'Developer' || credits[i] === 'Assets';
            this.add.text(cx, startY + i * 24, credits[i], {
                fontFamily: 'Kenney Future Narrow, Arial',
                fontSize: isHeader ? '22px' : '16px',
                color: isHeader ? '#ffcc00' : '#cccccc'
            }).setOrigin(0.5);
        }

        this.createButton(cx, cy + 220, 'BACK', () => {
            this.scene.start('title');
        });
    }

    createButton(x, y, label, callback) {
        let btn = this.add.image(x, y, 'creditsButton').setInteractive({ useHandCursor: true });
        btn.setScale(0.8, 0.55);

        let text = this.add.text(x, y, label, {
            fontFamily: 'Kenney Future, Arial',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btn.on('pointerover', () => {
            btn.setTexture('creditsButtonHover');
            text.setColor('#ffffff');
        });
        btn.on('pointerout', () => {
            btn.setTexture('creditsButton');
            text.setColor('#ffffff');
        });
        btn.on('pointerdown', callback);
    }
}
