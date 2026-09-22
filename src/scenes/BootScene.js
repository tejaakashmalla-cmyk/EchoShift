import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  create() {
    this.createTextures();
    this.scene.start("MenuScene");
  }

  createTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // Player: stylized temporal runner.
    g.fillStyle(0xd9ff5f, 1);
    g.fillRoundedRect(7, 3, 22, 35, 7);
    g.fillStyle(0x0b1020, 1);
    g.fillRoundedRect(10, 9, 16, 9, 4);
    g.fillStyle(0x66e3ff, 1);
    g.fillRect(12, 25, 12, 3);
    g.fillStyle(0xffffff, .75);
    g.fillCircle(14, 13, 1.5);
    g.generateTexture("player", 36, 42);

    // Echo avatar.
    g.clear();
    g.fillStyle(0x66e3ff, .28);
    g.fillRoundedRect(7, 3, 22, 35, 7);
    g.lineStyle(2, 0x9ceeff, .9);
    g.strokeRoundedRect(7, 3, 22, 35, 7);
    g.generateTexture("echo", 36, 42);

    // Drone.
    g.clear();
    g.fillStyle(0xff5578, 1);
    g.fillCircle(18, 18, 10);
    g.lineStyle(2, 0xffb0bf, .65);
    g.strokeCircle(18, 18, 15);
    g.fillStyle(0x1b0710, 1);
    g.fillCircle(18, 18, 4);
    g.generateTexture("drone", 36, 36);

    // Shard.
    g.clear();
    g.fillStyle(0xd9ff5f, 1);
    g.beginPath();
    g.moveTo(16, 0); g.lineTo(31, 16); g.lineTo(16, 32); g.lineTo(1, 16);
    g.closePath(); g.fillPath();
    g.fillStyle(0xffffff, .7);
    g.beginPath();
    g.moveTo(16, 4); g.lineTo(23, 16); g.lineTo(16, 13);
    g.closePath(); g.fillPath();
    g.generateTexture("crystal", 32, 32);

    // Exit gate.
    g.clear();
    g.fillStyle(0x65f4d3, .08);
    g.fillRoundedRect(2, 2, 52, 84, 8);
    g.lineStyle(3, 0x65f4d3, 1);
    g.strokeRoundedRect(2, 2, 52, 84, 8);
    g.lineStyle(2, 0x65f4d3, .45);
    g.lineBetween(14, 18, 42, 18);
    g.lineBetween(14, 34, 42, 34);
    g.lineBetween(14, 50, 42, 50);
    g.generateTexture("exit", 56, 88);

    // Platform.
    g.clear();
    g.fillStyle(0x172034, 1);
    g.fillRect(0, 0, 128, 24);
    g.fillStyle(0x3e5274, 1);
    g.fillRect(0, 0, 128, 3);
    g.fillStyle(0x1e2a40, 1);
    for (let x = 10; x < 120; x += 22) g.fillRect(x, 9, 9, 2);
    g.generateTexture("platform", 128, 24);

    g.destroy();
  }
}
