class Tank extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config) {
        super(scene, x, y, config.bodySpriteKey);

        this.config = config;
        this.maxHealth = config.maxHealth || 100;
        this.health = this.maxHealth;
        this.speed = config.speed || 200;
        this.rotationOffset = config.rotationOffset != null ? config.rotationOffset : SpriteFacing.DOWN;
        this.turretEntries = [];

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(false);
        this.setDepth(config.depth || 0);

        if (config.bodyWidth && config.bodyHeight) {
            this.body.setSize(config.bodyWidth, config.bodyHeight, true);
        }
        if (config.bodyOffsetX !== undefined) this.body.setOffset(config.bodyOffsetX, config.bodyOffsetY || 0);

        if (config.turretSlots) {
            config.turretSlots.forEach((slot) => {
                this.addTurret(slot.turretConfig, slot.socketX || 0, slot.socketY || 0);
            });
        }
    }

    addTurret(turretConfig, socketX, socketY) {
        let turret = new Turret(this.scene, this.x, this.y, turretConfig);
        this.turretEntries.push({ turret, socketX, socketY });
        return turret;
    }

    getTurret(index) {
        return this.turretEntries[index] ? this.turretEntries[index].turret : null;
    }

    move(vx, vy) {
        if (vx !== 0 || vy !== 0) {
            this.setRotation(Math.atan2(vy, vx) + this.rotationOffset);
        }
        this.setVelocity(vx * this.speed, vy * this.speed);
    }

    aimTurretsAt(worldX, worldY) {
        this.turretEntries.forEach((entry) => {
            entry.turret.aimAt(worldX, worldY, this.rotation);
        });
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        let cos = Math.cos(this.rotation);
        let sin = Math.sin(this.rotation);

        this.turretEntries.forEach((entry) => {
            let { turret, socketX, socketY } = entry;
            turret.x = this.x + socketX * cos - socketY * sin;
            turret.y = this.y + socketX * sin + socketY * cos;
        });
    }

    damage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.destroy();
        }
    }

    destroy(fromScene) {
        this.turretEntries.forEach((entry) => entry.turret.destroy(fromScene));
        this.turretEntries = [];
        super.destroy(fromScene);
    }
}
