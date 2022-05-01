"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const stream_1 = require("stream");
const util_1 = require("util");
const axios_1 = __importDefault(require("axios"));
const streamPipeline = (0, util_1.promisify)(stream_1.pipeline);
async function downloadFile(url, path, filename) {
    return new Promise(async (resolve, reject) => {
        const response = await axios_1.default.get(url);
        if (response.status !== 200) {
            return reject(new Error(`Unexpected response ${response.statusText}`));
        }
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
            await streamPipeline(response.data, (0, fs_1.createWriteStream)((path.endsWith("/") ? path : path + "/") + filename))
                .then(() => {
                resolve();
            })
                .catch((err) => {
                reject(err);
            });
        });
    });
}
exports.downloadFile = downloadFile;
