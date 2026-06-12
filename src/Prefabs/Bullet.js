class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key) {
        super(scene, x, y, key);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setDepth(2);
        this.body.setAllowGravity(false);
    }
}
