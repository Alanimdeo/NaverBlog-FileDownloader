import { readFile, writeFile } from "fs/promises";
import axios from "axios";
import rssParse from "rss-to-json";
import { downloadFile } from "./download";

export interface Config extends Object {
  interval: number;
  blogs: Blog[];
}

export interface Blog {
  title: string;
  url: string;
  downloads: BlogDownload[];
}

export interface BlogDownload {
  filterType: "title" | "category";
  keyword: string;
  destination: string;
  downloaded: string[];
}

export interface NaverBlogRSS {
  title: string;
  description: string;
  link: string;
  image: string;
  category: Array<any>;
  items: Array<{
    title: string;
    description: string;
    link: string;
    published: number;
    created: number;
    category: string;
    enclosures: Array<any>;
    media: Object;
  }>;
}

export interface NaverBlogDownloadInfo {
  encodedAttachFileName: string;
  encodedAttachFileNameByTruncate: string;
  encodedAttachFileUrl: string;
  licenseyn: string;
  maliciousCodeYn: "true" | "false";
  punishType: string;
  encodedAttachFileNameByUTF8: string;
  ahfLicenseYn: "true" | "false";
}

async function doJob(config: Config) {
  await Promise.all(
    // 오래된 다운로드 목록 삭제
    config.blogs.map(async (blog) => {
      if (blog.downloads.length === 0) return;
      const rss = (await rssParse(blog.url, {})) as NaverBlogRSS;
      const allLinks = rss.items.map((item) => item.link);
      blog.downloads.map((download) => {
        download.downloaded.map((link) => {
          if (!allLinks.includes(link)) download.downloaded.splice(download.downloaded.indexOf(link), 1);
        });
      });
      await Promise.all(
        blog.downloads.map(async (download) => {
          const items = rss.items.filter(
            (item) =>
              (download.filterType === "title"
                ? item.title.includes(download.keyword)
                : item.category.includes(download.keyword)) && !download.downloaded.includes(item.link)
          );
          if (items.length === 0) return;
          await Promise.all(
            items.map(async (item) => {
              download.downloaded.push(item.link);
              const link = item.link.split("/");
              const postId = link.pop();
              const blogId = link.pop();
              const files: NaverBlogDownloadInfo[] = JSON.parse(
                (await axios.get(`https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${postId}`)).data
                  .split("aPostFiles[1] = JSON.parse('")[1]
                  .split("'.replace(/\\\\'/g, ''));")[0]
              );
              await Promise.all(
                files.map(async (file) => {
                  try {
                    await downloadFile(file.encodedAttachFileUrl, download.destination, file.encodedAttachFileName);
                    console.log(`${file.encodedAttachFileName} 다운로드 완료`);
                  } catch (err) {
                    console.error(err);
                  }
                })
              );
            })
          );
        })
      );
    })
  );
  await writeFile("./config.json", JSON.stringify(config, null, 2));
  console.log("모든 작업 완료!");
}

readFile("./config.json").then((result) => {
  const config: Config = JSON.parse(result.toString());
  doJob(config); // setInterval은 처음 시작 시 작동하지 않음
  setInterval(doJob, config.interval * 1000, config);
});
