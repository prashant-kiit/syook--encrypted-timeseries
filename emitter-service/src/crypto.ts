import crypto from "crypto";

export function sha256(data: object): string {
  return crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

export function encryptAES(text: string): string {
  const PASS_KEY = process.env.PASS_KEY;
  if (!PASS_KEY) {
    throw new Error("PASS_KEY environment variable is not defined");
  }
  
  const key = crypto.createHash("sha256").update(PASS_KEY).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-256-ctr", key, iv);

  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}
