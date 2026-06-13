let config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1200,
    physics: {
        default: 'matter',
        matter: {
            debug: true,
            gravity: { x: 0, y: 0 }
        }
    },
    scene: [TitleScene, CreditsScene, Map, HUDScene, GameOverScene, PauseOverlay]
};

let game = new Phaser.Game(config);
