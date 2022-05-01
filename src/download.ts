import { createWriteStream } from "fs";
import { mkdir, readdir } from "fs/promises";
import { pipeline } from "stream";
import { promisify } from "util";
import axios from "axios";

const streamPipeline = promisify(pipeline);

export async function downloadFile(url: string, path: string, filename: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const response = await axios.get(url);

    if (response.status !== 200) {
      return reject(new Error(`Unexpected response ${response.statusText}`));
    }

    await readdir(path)
      .catch(async (err) => {
        if (err.code === "ENOENT") {
          return await mkdir(path, { recursive: true });
        } else {
          reject(err);
        }
      })
      .finally(async () => {
        await streamPipeline(response.data, createWriteStream((path.endsWith("/") ? path : path + "/") + filename))
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      });
  });
}
