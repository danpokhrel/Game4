class BulletGroup {
    // Factory/pool for Bullet instances — creates new bullets with Matter physics body
    constructor(scene) {
        this.scene = scene;
        this.bullets = [];
    }

    create(x, y, key) {
        let bullet = new Bullet(this.scene, x, y, key);
        this.bullets.push(bullet);
        return bullet;
    }

    fire(x, y, key, rotation, direction, speed, depth) {
        let bullet = this.create(x, y, key);
        bullet.setDepth(depth || 2);
        this.scene.matter.body.setAngle(bullet.body, rotation);
        bullet.setVelocity(Math.cos(direction) * speed / 60, Math.sin(direction) * speed / 60);
        return bullet;
    }

    addWallCollider() {
    }
}
