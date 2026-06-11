import express from "express";
import cors from "cors";
import { guardianRouter } from "./routes/guardian.js";
import { remediationRouter } from "./routes/remediation.js";
import { servicesRouter } from "./routes/services.js";
import { checkoutRouter } from "./routes/checkout.js";
import { paymentRouter } from "./routes/payment.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? "*",
  methods: ["GET", "POST"],
}));

app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "eudr-guardian-api" }));

app.use("/api/guardian", guardianRouter);
app.use("/api/remediation", remediationRouter);
app.use("/api/services", servicesRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/payment", paymentRouter);

app.listen(PORT, () => {
  console.log(`EUDR Guardian API running on port ${PORT}`);
});

export default app;
