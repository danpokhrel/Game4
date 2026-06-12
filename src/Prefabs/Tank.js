class Tank extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, config) {
        super(scene, x, y, config.bodySpriteKey);

        this.config = config;
        this.maxHealth = config.maxHealth || 100;
        this.health = this.maxHealth;
        this.speed = config.speed || 200;
        this.acceleration = config.acceleration || null;
        this.turnSpeed = config.turnSpeed || 80;
        this.turretEntries = [];

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(false);
        this.setDepth(config.depth || 0);

        let colSide = Math.round(Math.min(this.displayWidth, this.displayHeight) * 0.9);
        this.body.setSize(colSide, colSide, true);

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

    move(accelInput, turnInput) {
        this.setAngularVelocity(turnInput * this.turnSpeed);

        let forwardAngle = this.rotation + Math.PI / 2;
        let currentSpeed = accelInput * this.speed;
        this.setVelocity(
            Math.cos(forwardAngle) * currentSpeed,
            Math.sin(forwardAngle) * currentSpeed
        );
    }

    aimTurretsAt(worldX, worldY) {
        this.turretEntries.forEach((entry) => {
            entry.turret.aimAt(worldX, worldY, this.rotation, this.x, this.y);
        });
    }

    fire(bulletGroup) {
        this.turretEntries.forEach((entry) => {
            entry.turret.fire(bulletGroup);
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

        if (this.debugGraphics) {
            this.debugGraphics.clear();
            this.turretEntries.forEach((entry) => {
                let { turret } = entry;
                let tCos = Math.cos(turret.rotation);
                let tSin = Math.sin(turret.rotation);
                let bx = turret.x + turret.barrelEnd.x * tCos - turret.barrelEnd.y * tSin;
                let by = turret.y + turret.barrelEnd.x * tSin + turret.barrelEnd.y * tCos;

                this.debugGraphics.fillStyle(0x00ff00, 1);
                this.debugGraphics.fillCircle(turret.x, turret.y, 4);
                this.debugGraphics.fillStyle(0xff0000, 1);
                this.debugGraphics.fillCircle(bx, by, 4);
            });
        }
    }

    damage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.destroy();
        }
    }

    setDebug(enabled) {
        if (enabled && !this.debugGraphics) {
            this.debugGraphics = this.scene.add.graphics();
            this.debugGraphics.setDepth(2);
        }
        if (!enabled && this.debugGraphics) {
            this.debugGraphics.destroy();
            this.debugGraphics = null;
        }
    }

    destroy(fromScene) {
        if (this.debugGraphics) this.debugGraphics.destroy();
        this.turretEntries.forEach((entry) => entry.turret.destroy(fromScene));
        this.turretEntries = [];
        super.destroy(fromScene);
    }
}
