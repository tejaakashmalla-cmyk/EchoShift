import Phaser from "phaser";

export default class GameOverScene extends Phaser.Scene {
  constructor() { super("GameOverScene"); }
  init(data) { this.result = data || {}; }

  create() {
    const { width, height } = this.scale;
    const victory = !!this.result.victory;

    this.add.rectangle(0, 0, width, height, 0x050812, 1).setOrigin(0);
    for (let i = 0; i < 70; i++) {
      this.add.circle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), Phaser.Math.FloatBetween(.5, 1.7), victory ? 0xd9ff5f : 0xff5578, Phaser.Math.FloatBetween(.08, .35));
    }

    this.add.text(width / 2, 150, victory ? "EXTRACTION COMPLETE" : "SIGNAL LOST", {
      fontFamily: "Arial", fontSize: 46, fontStyle: "bold",
      color: victory ? "#d9ff5f" : "#ff6d8a", letterSpacing: 3
    }).setOrigin(.5);

    this.add.text(width / 2, 214,
      victory ? "You crossed two timelines without becoming part of either." : "The city reset your position.",
      { fontFamily: "Arial", fontSize: 15, color: "#7e8ba5" }
    ).setOrigin(.5);

    const panel = this.add.rectangle(width / 2, 350, 470, 170, 0x0c1220, .9).setStrokeStyle(1, 0x2a3850, 1);
    this.add.text(width / 2, 295, "MISSION REPORT", { fontFamily: "Arial", fontSize: 10, color: "#65748e", letterSpacing: 3 }).setOrigin(.5);
    this.add.text(width / 2, 330, `SCORE   ${String(this.result.score || 0).padStart(5, "0")}`, { fontFamily: "Arial", fontSize: 24, color: "#edf3ff" }).setOrigin(.5);
    this.add.text(width / 2, 372, `TEMPORAL SHARDS   ${this.result.collected || 0}`, { fontFamily: "Arial", fontSize: 13, color: "#9aa7bf" }).setOrigin(.5);
    this.add.text(width / 2, 402, `TIME   ${this.result.time || 0}s`, { fontFamily: "Arial", fontSize: 13, color: "#9aa7bf" }).setOrigin(.5);

    const retry = this.add.rectangle(width / 2, 510, 220, 54, 0xd9ff5f, 1).setInteractive({ useHandCursor: true });
    const label = this.add.text(width / 2, 510, "RUN AGAIN", { fontFamily: "Arial", fontSize: 13, fontStyle: "bold", color: "#09101a", letterSpacing: 2 }).setOrigin(.5);
    retry.on("pointerover", () => { retry.setFillStyle(0xffffff); label.setScale(1.04); });
    retry.on("pointerout", () => { retry.setFillStyle(0xd9ff5f); label.setScale(1); });
    retry.on("pointerdown", () => this.scene.start("GameScene"));
    this.input.keyboard.once("keydown-R", () => this.scene.start("GameScene"));
  }
}
