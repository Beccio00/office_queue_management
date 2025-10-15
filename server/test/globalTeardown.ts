import fs from "fs";
import fsp from "fs/promises";
import path from "path";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default async function globalTeardown() {
  const dbPath = path.resolve(__dirname, "test.db");
  const generated = path.resolve(__dirname, "..", "generated", "prisma");

  try {
    const maxAttempts = 8;
    const baseDelay = 100; // ms

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (fs.existsSync(dbPath)) {
          await fsp.unlink(dbPath);
        }

        // try to remove generated prisma folder if present
        if (fs.existsSync(generated)) {
          // fs.rmSync may not be available on older Node; prefer promises
          try {
            await fsp.rm(generated, { recursive: true, force: true });
          } catch (e) {
            // fallback to rimraf if rm is not supported
            try {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const rimraf = require("rimraf");
              rimraf.sync(generated);
            } catch (er) {
              // ignore
            }
          }
        }

        // success, exit loop
        break;
      } catch (err: any) {
        // If file is busy on Windows, wait and retry
        if (
          err &&
          (err.code === "EBUSY" ||
            err.code === "EPERM" ||
            err.code === "EACCES")
        ) {
          if (attempt === maxAttempts) {
            // log and give up
            // eslint-disable-next-line no-console
            console.warn(
              `globalTeardown: could not remove test DB after ${maxAttempts} attempts:`,
              err.message || err
            );
            break;
          }
          // wait with linear backoff
          await sleep(baseDelay * attempt);
          continue;
        }

        // other errors: log and break
        // eslint-disable-next-line no-console
        console.error("globalTeardown unexpected error:", err);
        break;
      }
    }
  } catch (finalErr) {
    // never fail teardown
    // eslint-disable-next-line no-console
    console.error("globalTeardown final failure:", finalErr);
  }
}
