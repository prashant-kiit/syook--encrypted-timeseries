import crypto from "crypto";

const PASS_KEY = process.env.PASS_KEY;
if (!PASS_KEY) {
  throw new Error("PASS_KEY environment variable is not defined");
}

const key = crypto.createHash("sha256").update(PASS_KEY).digest();

export function decryptAES(payload: string): string {
  const [ivHex, encryptedHex] = payload.split(":") as [string, string];

  const decipher = crypto.createDecipheriv(
    "aes-256-ctr",
    key,
    Buffer.from(ivHex, "hex")
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString();
}

export function sha256(obj: object) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(obj))
    .digest("hex");
}
