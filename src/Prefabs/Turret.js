class Turret extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config) {
        super(scene, x, y);

        this.barrelEnd = { x: config.barrelEndX || 0, y: config.barrelEndY || -40 };
        this.bulletKey = config.bulletKey || null;
        this.shotKey = config.shotKey || null;
        this.rotationOffset = config.rotationOffset != null ? config.rotationOffset : SpriteFacing.DOWN;
        this.bulletRotationOffset = config.bulletRotationOffset != null ? config.bulletRotationOffset : SpriteFacing.UP;

        this.sprite = scene.add.image(config.spriteOffsetX || 0, config.spriteOffsetY || 0, config.spriteKey);
        this.add(this.sprite);

        this.setDepth(config.depth || 1);

        scene.add.existing(this);
    }

    aimAt(worldX, worldY) {
        let angle = Phaser.Math.Angle.Between(this.x, this.y, worldX, worldY);
        this.setRotation(angle + this.rotationOffset);
    }

    getFireWorldPosition() {
        let cos = Math.cos(this.rotation);
        let sin = Math.sin(this.rotation);
        let bx = this.barrelEnd.x;
        let by = this.barrelEnd.y;
        let fireRotation = this.rotation - this.rotationOffset + this.bulletRotationOffset;
        return {
            x: this.x + bx * cos - by * sin,
            y: this.y + bx * sin + by * cos,
            rotation: fireRotation
        };
    }
}
