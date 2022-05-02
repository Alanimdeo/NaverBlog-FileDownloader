"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = void 0;
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const https_1 = __importDefault(require("https"));
async function downloadFile(url, path, filename) {
    return new Promise(async (resolve, reject) => {
        await (0, promises_1.readdir)(path)
            .catch(async (err) => {
            if (err.code === "ENOENT") {
                return await (0, promises_1.mkdir)(path, { recursive: true });
            }
            else {
                reject(err);
            }
        })
            .finally(async () => {
            const splitUrl = url.replace(/(http|https):\/\//, "").split("/");
            const host = splitUrl.shift();
            const pathname = "/" + splitUrl.join("/");
            console.log(host, pathname);
            https_1.default.get({
                host,
                path: pathname,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.41 Safari/537.36",
                },
            }, (res) => {
                res.on("error", (err) => {
                    return reject(err);
                });
                const file = (0, fs_1.createWriteStream)((path.endsWith("/") ? path : path + "/") + filename);
                res.pipe(file);
                res.on("end", () => {
                    file.close();
                    return resolve();
                });
                file.on("error", (err) => {
                    file.close();
                    return reject(err);
                });
            });
        });
    });
}
exports.downloadFile = downloadFile;
