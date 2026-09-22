import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() { super("MenuScene"); }

  create() {
    const { width, height } = this.scale;
    this.input.keyboard.once("keydown", () => this.startGame());

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060914, 0x0b1020, 0x04060d, 0x07131a, 1);
    bg.fillRect(0, 0, width, height);

    // Starfield.
    for (let i = 0; i < 110; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const r = Phaser.Math.FloatBetween(.5, 1.8);
      this.add.circle(x, y, r, i % 4 === 0 ? 0x66e3ff : 0x7180a0, Phaser.Math.FloatBetween(.12, .5));
    }

    // Timeline horizon.
    const horizon = this.add.rectangle(width * .72, height * .63, width * .7, 1, 0x66e3ff, .18);
    this.tweens.add({ targets: horizon, alpha: .03, duration: 1800, yoyo: true, repeat: -1 });

    const orb = this.add.circle(width * .73, height * .39, 145, 0x66e3ff, .035);
    this.tweens.add({ targets: orb, scale: 1.3, alpha: .07, duration: 2600, yoyo: true, repeat: -1 });

    this.add.text(82, 128, "ECHOSHIFT", {
      fontFamily: "Arial", fontSize: 66, fontStyle: "bold", color: "#edf3ff", letterSpacing: 8
    });
    this.add.text(87, 204, "TEMPORAL STEALTH // BUILD 002", {
      fontFamily: "Arial", fontSize: 11, color: "#66e3ff", letterSpacing: 3
    });
    this.add.text(87, 252,
      "THE CITY REMEMBERS WHAT YOU ERASE.",
      { fontFamily: "Arial", fontSize: 16, color: "#7d8aa5", letterSpacing: 3 }
    );

    this.add.text(87, 316,
      "Two timelines. One body.\nOne route that does not exist until you shift.",
      { fontFamily: "Arial", fontSize: 19, color: "#c2ccdd", lineSpacing: 12 }
    );

    const button = this.add.rectangle(196, 475, 260, 60, 0xd9ff5f, 1)
      .setInteractive({ useHandCursor: true });
    const buttonText = this.add.text(196, 475, "ENTER THE SHIFT", {
      fontFamily: "Arial", fontSize: 14, fontStyle: "bold", color: "#07101a", letterSpacing: 2
    }).setOrigin(.5);
    button.on("pointerover", () => { button.setFillStyle(0xffffff); buttonText.setScale(1.03); });
    button.on("pointerout", () => { button.setFillStyle(0xd9ff5f); buttonText.setScale(1); });
    button.on("pointerdown", () => this.startGame());

    this.add.text(87, 565, "A / D  MOVE     SPACE  JUMP     E  SHIFT     R  RESTART", {
      fontFamily: "Arial", fontSize: 10, color: "#5f6c85", letterSpacing: 1.4
    });
    this.add.text(width - 55, height - 35, "PROTOTYPE // 002", {
      fontFamily: "Arial", fontSize: 10, color: "#46516a"
    }).setOrigin(1);
  }

  startGame() {
    if (this.scene.isActive("GameScene")) return;
    this.scene.start("GameScene");
  }
}
