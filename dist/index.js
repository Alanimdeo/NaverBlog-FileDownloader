"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const axios_1 = __importDefault(require("axios"));
const rss_to_json_1 = __importDefault(require("rss-to-json"));
const download_1 = require("./download");
async function doJob() {
    const config = JSON.parse((await (0, promises_1.readFile)("./config.json")).toString());
    await Promise.all(
    // 오래된 다운로드 목록 삭제
    config.blogs.map(async (blog) => {
        if (blog.downloads.length === 0)
            return;
        const rss = (await (0, rss_to_json_1.default)(blog.url, {}));
        const allLinks = rss.items.map((item) => item.link);
        blog.downloads.map((download) => {
            download.downloaded.map((link) => {
                if (!allLinks.includes(link))
                    download.downloaded.splice(download.downloaded.indexOf(link), 1);
            });
        });
        await Promise.all(blog.downloads.map(async (download) => {
            const items = rss.items.filter((item) => (download.filterType === "title"
                ? item.title.includes(download.keyword)
                : item.category.includes(download.keyword)) && !download.downloaded.includes(item.link));
            if (items.length === 0)
                return;
            await Promise.all(items.map(async (item) => {
                download.downloaded.push(item.link);
                const link = item.link.split("/");
                const postId = link.pop();
                const blogId = link.pop();
                const files = JSON.parse((await axios_1.default.get(`https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${postId}`)).data
                    .split("aPostFiles[1] = JSON.parse('")[1]
                    .split("'.replace(/\\\\'/g, ''));")[0]);
                await Promise.all(files.map(async (file) => {
                    try {
                        await (0, download_1.downloadFile)(file.encodedAttachFileUrl, download.destination, file.encodedAttachFileName);
                        console.log(`${file.encodedAttachFileName} 다운로드 완료`);
                    }
                    catch (err) {
                        console.error(err);
                    }
                }));
            }));
        }));
    }));
    await (0, promises_1.writeFile)("./config.json", JSON.stringify(config, null, 2));
    setTimeout(doJob, config.interval);
}
doJob();
