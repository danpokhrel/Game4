class Bullet extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, key) {
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.matter.add.gameObject(this, {
            frictionAir: 0,
            friction: 0,
            restitution: 0,
            isSensor: true
        });
        this.setCollisionCategory(BULLET_CATEGORY);
        this.setCollidesWith([WALL_CATEGORY]);
        this.damage = 0;
        this.setDepth(2);
    }

    destroy(fromScene) {
        if (this.body) {
            this.world.remove(this.body, true);
            this.body.gameObject = null;
        }
        super.destroy(fromScene);
    }
}
