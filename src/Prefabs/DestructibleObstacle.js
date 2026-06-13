class DestructibleObstacle extends Phaser.GameObjects.Sprite {
    // Destructible obstacle — takes bullet damage, fades on hit, explodes when destroyed
    constructor(scene, x, y, key, frame, config) {
        super(scene, x, y, key, frame);

        this.maxHealth = config.maxHealth || 1;
        this.health = this.maxHealth;
        this.setDepth(config.depth || 0);
        this.setOrigin(0.5);

        if (config.rotation) {
            this.rotation = config.rotation;
        }

        let bodyWidth = config.bodyWidth || 64;
        let bodyHeight = config.bodyHeight || 64;

        scene.add.existing(this);
        scene.matter.add.gameObject(this, {
            shape: {
                type: 'rectangle',
                width: bodyWidth,
                height: bodyHeight
            },
            isStatic: true,
            collisionFilter: {
                category: WALL_CATEGORY,
                mask: TANK_CATEGORY | ENEMY_TANK_CATEGORY | BULLET_CATEGORY
            }
        });

        this.setCollisionCategory(WALL_CATEGORY);
        this.setCollidesWith([TANK_CATEGORY, ENEMY_TANK_CATEGORY, BULLET_CATEGORY]);
    }

    damage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.scene.events.emit('obstacleDestroyed', this.x, this.y);
            this.destroy();
        } else {
            this.setAlpha(0.5 + (this.health / this.maxHealth) * 0.5);
        }
    }

    destroy(fromScene) {
        if (this.body) {
            this.world.remove(this.body, true);
            this.body.gameObject = null;
        }
        super.destroy(fromScene);
    }
}
