class TankManager {
    constructor(scene, colliders, bulletGroup) {
        this.scene = scene;
        this.colliders = colliders;
        this.bulletGroup = bulletGroup;
        this.tanks = [];
    }

    addTank(tank) {
        this.tanks.push(tank);
        this.scene.physics.add.collider(tank, this.colliders);
        this.bulletGroup.addWallCollider(this.colliders);
        return tank;
    }

    getPlayer() {
        return this.tanks[0] || null;
    }

    update() {
    }
}
