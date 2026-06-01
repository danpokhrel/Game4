let config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 1200,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: [Map]
};

let game = new Phaser.Game(config);
