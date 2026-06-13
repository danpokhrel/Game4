class EnemyAI {
    constructor(scene, tank, bulletGroup, pathfinder) {
        this.scene = scene;
        this.tank = tank;
        this.bulletGroup = bulletGroup;
        this.pathfinder = pathfinder;
        this.state = EnemyState.CHASE;
        this.path = null;
        this.waypointIndex = 0;
        this.pathRecomputeTimer = 0;
        this.pathRecomputeInterval = 500;
        this.attackRange = 400;
        this.attackBreakRange = 550;
        this.waypointThreshold = 64;
        this.stuckTimer = 0;
        this.lastPosition = { x: tank.x, y: tank.y };
    }

    update(time, delta, playerTank) {
        if (!this.tank.active || !playerTank || !playerTank.active) return;

        let dx = playerTank.x - this.tank.x;
        let dy = playerTank.y - this.tank.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        let hasLOS = this.pathfinder.hasLineOfSight(
            this.tank.x, this.tank.y,
            playerTank.x, playerTank.y
        );

        this.updateState(dist, hasLOS);

        switch (this.state) {
            case EnemyState.CHASE:
                this.updateChase(delta, playerTank);
                break;
            case EnemyState.ATTACK:
                this.updateAttack(playerTank);
                break;
        }

        this.stuckTimer += delta;
        if (this.stuckTimer > 2000) {
            let movedX = this.tank.x - this.lastPosition.x;
            let movedY = this.tank.y - this.lastPosition.y;
            let moved = Math.sqrt(movedX * movedX + movedY * movedY);
            if (moved < 10) {
                this.path = null;
                this.waypointIndex = 0;
            }
            this.lastPosition.x = this.tank.x;
            this.lastPosition.y = this.tank.y;
            this.stuckTimer = 0;
        }
    }

    updateState(dist, hasLOS) {
        if (this.state === EnemyState.CHASE) {
            if (dist <= this.attackRange && hasLOS) {
                this.state = EnemyState.ATTACK;
            }
        } else if (this.state === EnemyState.ATTACK) {
            if (dist > this.attackBreakRange || !hasLOS) {
                this.state = EnemyState.CHASE;
                this.path = null;
                this.waypointIndex = 0;
            }
        }
    }

    updateChase(delta, playerTank) {
        this.pathRecomputeTimer += delta;
        if (this.pathRecomputeTimer >= this.pathRecomputeInterval || !this.path) {
            this.path = this.pathfinder.findPath(
                this.tank.x, this.tank.y,
                playerTank.x, playerTank.y
            );
            this.waypointIndex = 0;
            this.pathRecomputeTimer = 0;
        }

        if (this.path && this.path.length > 0 && this.waypointIndex < this.path.length) {
            let wp = this.path[this.waypointIndex];
            let wpDx = wp.x - this.tank.x;
            let wpDy = wp.y - this.tank.y;
            let wpDist = Math.sqrt(wpDx * wpDx + wpDy * wpDy);

            if (wpDist < this.waypointThreshold) {
                this.waypointIndex++;
                if (this.waypointIndex >= this.path.length) {
                    this.waypointIndex = this.path.length - 1;
                }
                wp = this.path[this.waypointIndex];
                wpDx = wp.x - this.tank.x;
                wpDy = wp.y - this.tank.y;
            }

            this.steerToward(wp.x, wp.y);
        } else {
            this.steerToward(playerTank.x, playerTank.y);
        }

        this.tank.aimTurretsAt(playerTank.x, playerTank.y);
    }

    updateAttack(playerTank) {
        let { turn } = this.computeSteer(playerTank.x, playerTank.y);
        this.tank.move(0, turn);
        this.tank.aimTurretsAt(playerTank.x, playerTank.y);
        this.tank.fire(this.bulletGroup);
    }

    computeSteer(targetX, targetY) {
        let angleToTarget = Math.atan2(targetY - this.tank.y, targetX - this.tank.x);
        let targetBodyAngle = angleToTarget - Math.PI / 2;
        let currentAngle = this.tank.body.angle;
        let angleDiff = Phaser.Math.Angle.Wrap(targetBodyAngle - currentAngle);

        let turn = 0;
        let accel = 0;

        if (Math.abs(angleDiff) > 0.1) {
            turn = angleDiff > 0 ? 1 : -1;
            if (Math.abs(angleDiff) < 0.5) {
                turn = angleDiff * 2;
            }
        }

        if (Math.abs(angleDiff) < Math.PI / 3) {
            accel = 1 - Math.abs(angleDiff) / (Math.PI / 3);
        }

        return { turn, accel };
    }

    steerToward(targetX, targetY) {
        let { turn, accel } = this.computeSteer(targetX, targetY);
        this.tank.move(accel, turn);
    }
}
