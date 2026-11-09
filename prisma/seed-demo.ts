import { PrismaClient } from "@prisma/client";
import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { assertDemoEnvironment, seedDemoContent } from "./demo-content";

async function main() {
  assertDemoEnvironment(process.env);
  const media = process.env.DEMO_MEDIA_ROOT;
  if (!media || !path.isAbsolute(media) || await realpath(media) !== await realpath(path.join(process.cwd(), "public/uploads"))) throw new Error("DEMO_MEDIA_ROOT must be the existing isolated public/uploads target.");
  const db = new PrismaClient();
  try {
    // Check DB safety before touching files; repeat seed is a no-op for existing
    // records. Placeholder files are owned, generated raster assets, not logos.
    const result = await seedDemoContent(db, process.env);
    const bytes = await sharp({ create: { width: 1200, height: 600, channels: 3, background: "#F6F6F6" } }).png().toBuffer();
    for (const kind of ["promo_banner", "leasing_partner"]) {
      const file = path.join(media, "dealers/default/content", kind, "demo-placeholder.png");
      for (const segment of ["dealers", "default", "content", kind]) {
        const parent = segment === "dealers" ? path.join(media, segment) : segment === "default" ? path.join(media, "dealers", segment) : segment === "content" ? path.join(media, "dealers/default", segment) : path.dirname(file);
        await mkdir(parent, { recursive: true });
        if ((await lstat(parent)).isSymbolicLink() || !(await lstat(parent)).isDirectory()) throw new Error("Demo media directories must not be symlinks.");
      }
      try { await writeFile(file, bytes, { flag: "wx" }); }
      catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "EEXIST" && (await readFile(file)).equals(bytes))) throw new Error("Refusing to overwrite an existing demo media file.");
      }
    }
    console.info(JSON.stringify({ event: "demo.content_ready", ...result }));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Demo seed refused or failed. Verify the dedicated database, environment, and media root. No credentials are logged."); process.exitCode = 1; });
