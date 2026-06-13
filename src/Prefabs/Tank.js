class Tank extends Phaser.GameObjects.Sprite {
    // Tank prefab — body sprite with Matter physics, turret slots that rotate independently
    constructor(scene, x, y, config) {
        super(scene, x, y, config.bodySpriteKey);

        this.config = config;
        this.maxHealth = config.maxHealth || 100;
        this.health = this.maxHealth;
        this.speed = config.speed || 100;
        this.turnSpeed = this.speed * 2 / 60;
        this.turretEntries = [];

        scene.add.existing(this);
        scene.matter.add.gameObject(this, {
            frictionAir: 0,
            friction: 0,
            restitution: 0.1
        });

        this.setFixedRotation();
        this.isEnemy = false; // set true by EnemyController for collision filter differentiation
        this.setCollisionCategory(TANK_CATEGORY);
        this.setCollidesWith([WALL_CATEGORY, TANK_CATEGORY, ENEMY_TANK_CATEGORY, BULLET_CATEGORY]);

        this.setDepth(config.depth || 0);

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
        if (!this.body) return;
        let deltaSec = this.scene.sys.game.loop.delta / 1000;
        let newAngle = this.body.angle + turnInput * this.turnSpeed * deltaSec;
        this.scene.matter.body.setAngle(this.body, newAngle);

        let forwardAngle = newAngle + Math.PI / 2;
        let currentSpeed = accelInput * this.speed * deltaSec;
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

    // Fire all turrets — sets bullet collision filters based on whether this is an enemy or player tank
    fire(bulletGroup) {
        this.turretEntries.forEach((entry) => {
            let bullet = entry.turret.fire(bulletGroup);
            if (bullet) {
                bullet.damage = entry.turret.damage;
                if (this.isEnemy) {
                    bullet.setCollidesWith([WALL_CATEGORY, TANK_CATEGORY]);
                } else {
                    bullet.setCollidesWith([WALL_CATEGORY, ENEMY_TANK_CATEGORY]);
                }
            }
        });
    }

    // Reposition each turret at its socket offset (rotated with tank body) every frame
    preUpdate(time, delta) {
        if (!this.body) return;
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

    // Reduce health; emit tankdestroyed event with tank reference when health reaches zero
    damage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.scene.events.emit('tankdestroyed', this.x, this.y, this);
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
        if (this.body) {
            this.world.remove(this.body, true);
            this.body.gameObject = null;
        }
        super.destroy(fromScene);
    }
}
