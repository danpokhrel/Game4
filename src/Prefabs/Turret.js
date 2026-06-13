class Turret extends Phaser.GameObjects.Container {
    // Independent turret that aims and fires; positioned at socket offset on parent tank each frame
    constructor(scene, x, y, config) {
        super(scene, x, y);

        this.barrelEnd = { x: config.barrelEndX || 0, y: config.barrelEndY || -40 };
        this.bulletKey = config.bulletKey || null;
        this.shotKey = config.shotKey || null;
        this.rotationOffset = config.rotationOffset != null ? config.rotationOffset : SpriteFacing.DOWN;
        this.bulletRotationOffset = config.bulletRotationOffset != null ? config.bulletRotationOffset : SpriteFacing.UP;
        this.angleLimit = config.angleLimit || null;
        this.damage = config.damage || 10;
        this.bulletSpeed = config.bulletSpeed || 400;
        this.reloadTime = (config.reloadTime || 1) * 1000;
        this.lastFireTime = -Infinity; // cooldown tracking — prevents firing faster than reloadTime

        this.sprite = scene.add.image(config.spriteOffsetX || 0, config.spriteOffsetY || 0, config.spriteKey);
        if (config.flipX) this.sprite.setFlipX(true);
        this.add(this.sprite);

        this.setDepth(config.depth || 1);

        scene.add.existing(this);
    }

    // Aim the turret toward a world point, clamped by angleLimit relative to the tank body rotation
    aimAt(worldX, worldY, tankRotation, tankX, tankY) {
        let angle = Phaser.Math.Angle.Between(tankX, tankY, worldX, worldY);
        let targetRotation = angle + this.rotationOffset;

        if (this.angleLimit != null && tankRotation != null) {
            let offset = Phaser.Math.Angle.Wrap(targetRotation - tankRotation);
            offset = Phaser.Math.Clamp(offset, -this.angleLimit, this.angleLimit);
            targetRotation = tankRotation + offset;
        }

        this.setRotation(targetRotation);
    }

    // Compute barrel tip world position and bullet rotation for spawning projectiles
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

    // Fire a bullet if cooldown has elapsed; spawns from barrel tip at configured speed
    fire(bulletGroup) {
        let now = this.scene.time.now;
        if (now - this.lastFireTime < this.reloadTime) return null;
        this.lastFireTime = now;

        let pos = this.getFireWorldPosition();
        let direction = this.rotation - this.rotationOffset;

        let bullet = bulletGroup.create(pos.x, pos.y, this.bulletKey);
        bullet.setDepth(2);
        this.scene.matter.body.setAngle(bullet.body, pos.rotation);
        let deltaSec = this.scene.sys.game.loop.delta / 1000;
        bullet.setVelocity(Math.cos(direction) * this.bulletSpeed * deltaSec, Math.sin(direction) * this.bulletSpeed * deltaSec);

        let turretScene = this.scene;
        this.scene.time.delayedCall(3000, () => {
            if (bullet.active) {
                if (turretScene && turretScene.events) turretScene.events.emit('bulletimpact', bullet.x, bullet.y);
                bullet.destroy();
            }
        });

        if (this.shotKey) {
            let flash = this.scene.add.image(pos.x, pos.y, this.shotKey);
            flash.setDepth(3);
            flash.setOrigin(0.5, 0);
            flash.setRotation(this.rotation);
            this.scene.time.delayedCall(100, () => flash.destroy());
        }

        if (this.scene.sound && this.scene.cache.audio.has('shot')) {
            this.scene.sound.play('shot', { volume: 0.3 });
        }

        return bullet;
    }
}
