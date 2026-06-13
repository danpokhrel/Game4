class GameFeedback {
    // Combat feedback effects — camera shake on player hit, tint flash on any tank hit
    constructor(scene) {
        this.scene = scene;
    }

    // Shake the camera briefly to emphasize player damage
    shakeOnPlayerHit() {
        this.scene.cameras.main.shake(200, 0.005);
    }

    // Flash the target white for 100ms to indicate a hit
    flashOnHit(target) {
        if (!target || !target.active) return;
        target.setTintFill(0xffffff);
        this.scene.time.delayedCall(100, () => {
            if (target.active) target.clearTint();
        });
    }
}
