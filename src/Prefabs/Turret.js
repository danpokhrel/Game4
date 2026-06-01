class Turret extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config) {
        super(scene, x, y);

        this.barrelEnd = { x: config.barrelEndX || 0, y: config.barrelEndY || -40 };

        this.sprite = scene.add.image(0, 0, config.spriteKey);
        this.add(this.sprite);

        this.setDepth(config.depth || 1);

        scene.add.existing(this);
    }

    aimAt(worldX, worldY) {
        let angle = Phaser.Math.Angle.Between(this.x, this.y, worldX, worldY);
        this.setRotation(angle + Math.PI / 2);
    }

    getFireWorldPosition() {
        let cos = Math.cos(this.rotation);
        let sin = Math.sin(this.rotation);
        let bx = this.barrelEnd.x;
        let by = this.barrelEnd.y;
        return {
            x: this.x + bx * cos - by * sin,
            y: this.y + bx * sin + by * cos,
            rotation: this.rotation
        };
    }
}
