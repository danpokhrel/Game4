class PlayerController {
    constructor(scene, tank, bulletGroup) {
        this.scene = scene;
        this.tank = tank;
        this.bulletGroup = bulletGroup;

        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        scene.input.on('pointerdown', () => {
            this.tank.fire(this.bulletGroup);
        });
    }

    update() {
        let accel = 0;
        let turn = 0;

        if (this.wasd.up.isDown || this.cursors.up.isDown) accel += 1;
        if (this.wasd.down.isDown || this.cursors.down.isDown) accel -= 1;
        if (this.wasd.left.isDown || this.cursors.left.isDown) turn -= 1;
        if (this.wasd.right.isDown || this.cursors.right.isDown) turn += 1;

        this.tank.move(accel, turn);

        let pointer = this.scene.input.activePointer;
        let worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.tank.aimTurretsAt(worldPoint.x, worldPoint.y);
    }
}
