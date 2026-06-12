class BulletGroup {
    constructor(scene) {
        this.scene = scene;
        this.group = scene.physics.add.group({ allowGravity: false });
    }

    fire(x, y, key, rotation, direction, speed, depth) {
        let bullet = this.group.create(x, y, key);
        bullet.setDepth(depth || 2);
        bullet.setRotation(rotation);
        bullet.setVelocity(Math.cos(direction) * speed, Math.sin(direction) * speed);
        bullet.body.setAllowGravity(false);
        return bullet;
    }

    addWallCollider(colliders) {
        this.scene.physics.add.collider(this.group, colliders, (bullet) => {
            let x = bullet.x;
            let y = bullet.y;
            bullet.destroy();
            this.scene.events.emit('bulletimpact', x, y);
        });
    }

    cleanupOutOfBounds(bounds) {
        this.group.children.each((bullet) => {
            if (bullet.active && !bounds.contains(bullet.x, bullet.y)) {
                bullet.destroy();
            }
        });
    }
}
