import { PrismaClient } from "@prisma/client";
import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { demoMediaAssets } from "./demo-media";
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
    for (const {key,bytes} of await demoMediaAssets()) {
      const file = path.join(media,key);
      let parent=media;
      for(const segment of key.split("/").slice(0,-1)){
        parent=path.join(parent,segment);await mkdir(parent,{recursive:true});
        const stat=await lstat(parent);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error("Demo media directories must not be symlinks.");
      }
      try {await writeFile(file,bytes,{flag:"wx"});}
      catch(error){if(!(error instanceof Error && "code" in error && error.code==="EEXIST" && !(await lstat(file)).isSymbolicLink() && (await readFile(file)).equals(bytes)))throw new Error("Refusing to overwrite existing demo media.");}
    }
    console.info(JSON.stringify({ event: "demo.content_ready", ...result }));
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Demo seed refused or failed. Verify the dedicated database, environment, and media root. No credentials are logged."); process.exitCode = 1; });
