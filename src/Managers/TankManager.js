class TankManager {
    constructor(scene, bulletGroup) {
        this.scene = scene;
        this.bulletGroup = bulletGroup;
        this.tanks = [];
    }

    addTank(tank) {
        this.tanks.push(tank);
        return tank;
    }

    getPlayer() {
        return this.tanks[0] || null;
    }

    update() {
    }
}
