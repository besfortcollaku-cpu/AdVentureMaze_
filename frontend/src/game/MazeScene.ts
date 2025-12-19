import Phaser from "phaser";

const BACKEND = "https://YOUR-BACKEND-URL"; // 🔴 replace with your backend URL

export default class MazeScene extends Phaser.Scene {
  private payText!: Phaser.GameObjects.Text;
  private pointsText!: Phaser.GameObjects.Text;
  private adBtn!: Phaser.GameObjects.Text;

  private points = 0;

  constructor() {
    super("MazeScene");
  }

  create() {
    const { width, height } = this.scale;

    // Background
    this.cameras.main.setBackgroundColor("#0b1a2a");

    // Title
    this.add.text(width / 2, 20, "Pi Maze", {
      fontSize: "20px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Points text
    this.pointsText = this.add.text(16, 60, "Points this week: 0", {
      fontSize: "14px",
      color: "#ffffff",
    });

    // ----------------------------
    // 💰 PI PAYMENT BUTTON
    // ----------------------------
    this.payText = this.add
      .text(16, 100, "Confirm App Setup (0.01 Pi)", {
        fontSize: "14px",
        color: "#00ffcc",
        backgroundColor: "#102030",
        padding: { x: 10, y: 6 },
      })
      .setInteractive({ useHandCursor: true });

    this.payText.on("pointerup", async () => {
      try {
        this.payText.disableInteractive();
        this.payText.setText("Processing...");

        const Pi = (window as any).Pi;
        if (!Pi) throw new Error("Pi SDK not available");

        Pi.createPayment(
          {
            amount: 0.01,
            memo: "Confirm App Setup",
            metadata: { type: "app_setup" },
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              await fetch(`${BACKEND}/pi/payments/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId }),
              });
            },

            onReadyForServerCompletion: async (
              paymentId: string,
              txid: string
            ) => {
              await fetch(`${BACKEND}/pi/payments/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paymentId, txid }),
              });

              this.payText.setText("✅ Setup completed");
            },

            onCancel: () => {
              this.payText.setText("Confirm App Setup (0.01 Pi)");
              this.payText.setInteractive();
            },

            onError: (err: any) => {
              alert("Payment error: " + JSON.stringify(err));
              this.payText.setText("Confirm App Setup (0.01 Pi)");
              this.payText.setInteractive();
            },
          }
        );
      } catch (e: any) {
        alert("Payment failed: " + e.message);
        this.payText.setText("Confirm App Setup (0.01 Pi)");
        this.payText.setInteractive();
      }
    });

    // ----------------------------
    // 📺 WATCH AD BUTTON (MOCK)
    // ----------------------------
    this.adBtn = this.add
      .text(16, 150, "Watch Ad (+1 point)", {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#203040",
        padding: { x: 10, y: 6 },
      })
      .setInteractive({ useHandCursor: true });

    this.adBtn.on("pointerup", () => this.mockWatchAd());
  }

  // ----------------------------
  // 📺 MOCK AD LOGIC
  // ----------------------------
  mockWatchAd() {
    this.adBtn.disableInteractive();
    this.adBtn.setText("Watching ad...");

    this.time.delayedCall(2000, () => {
      this.points++;
      this.pointsText.setText(`Points this week: ${this.points}`);
      this.adBtn.setText("Watch Ad (+1 point)");
      this.adBtn.setInteractive({ useHandCursor: true });
    });
  }
}