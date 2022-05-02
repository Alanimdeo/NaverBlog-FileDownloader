import { mkdir, readdir } from "fs/promises";
import { createWriteStream } from "fs";
import https from "https";

export async function downloadFile(url: string, path: string, filename: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    await readdir(path)
      .catch(async (err) => {
        if (err.code === "ENOENT") {
          return await mkdir(path, { recursive: true });
        } else {
          reject(err);
        }
      })
      .finally(async () => {
        const splitUrl = url.replace(/(http|https):\/\//, "").split("/");
        const host = splitUrl.shift();
        const pathname = "/" + splitUrl.join("/");
        console.log(host, pathname);
        https.get(
          {
            host,
            path: pathname,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36",
            },
          },
          (res) => {
            res.on("error", (err) => {
              return reject(err);
            });
            const file = createWriteStream((path.endsWith("/") ? path : path + "/") + filename);
            res.pipe(file);
            res.on("end", () => {
              file.close();
              return resolve();
            });
            file.on("error", (err) => {
              file.close();
              return reject(err);
            });
          }
        );
      });
  });
}
