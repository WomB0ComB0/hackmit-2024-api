import puppeteer from "puppeteer-extra";
import { LaunchOptions } from "puppeteer";
import fs from "fs/promises";
import path from "path";
// import { fileURLToPath } from "node:url";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

interface Row {
  text: string;
}

interface TrieNode {
  children: { [key: string]: TrieNode };
  isEndOfWord: boolean;
}

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const createTrieNode = (): TrieNode => ({
  children: {},
  isEndOfWord: false,
});

const insertIntoTrie = (root: TrieNode, word: string): void => {
  let node = root;
  for (const char of word) {
    if (!node.children[char]) {
      node.children[char] = createTrieNode();
    }
    node = node.children[char];
  }
  node.isEndOfWord = true;
};

const searchInTrie = (root: TrieNode, word: string): boolean => {
  let node = root;
  for (const char of word) {
    if (!node.children[char]) {
      return false;
    }
    node = node.children[char];
  }
  return node.isEndOfWord;
};

const createHashSet = <T>(arr: T[]): Set<T> => {
  const hashSet: Set<T> = new Set<T>();
  const duplicates: T[] = [];

  for (const item of arr) {
    if (hashSet.has(item)) {
      duplicates.push(item);
    } else {
      hashSet.add(item);
    }
  }
  return hashSet;
};

const removeInternalDuplicates = (text: string): string => {
  const segments: RegExpMatchArray = text.match(/[^.!?]+[.!?]+/g) || [text];
  const uniqueSegments: Set<string> = new Set<string>();
  const result: string[] = [];

  for (const segment of segments) {
    if (!uniqueSegments.has(segment)) {
      uniqueSegments.add(segment);
      result.push(segment);
    }
  }

  return result.join(" ");
};

const removeExternalDuplicates = (text: string): string => {
  const segments: RegExpMatchArray = text.match(/[^.!?]+[.!?]+/g) || [text];
  const uniqueSegments: Set<string> = new Set<string>();
  const result: string[] = [];

  for (const segment of segments) {
    if (!uniqueSegments.has(segment)) {
      uniqueSegments.add(segment);
      result.push(segment);
    }
  }

  return result.join(" ");
};

const removeDuplicates = (text: string): string => {
  return removeInternalDuplicates(removeExternalDuplicates(text));
};

const wait = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

let cachedData: Row[] | null = null;
let cachedNewWords: Row[] | null = null;
let filterTrie: TrieNode | null = null;
let filterDict: Set<string> | null = null;
let newWordsTree: TrieNode | null = null;
let newWordsDict: Set<string> | null = null;
let cachedNSFW: string[] | null = null;

const initializeFilterWords = async (): Promise<void> => {
  const filePath = path.join(__dirname, "..", "data", "slurs.txt");
  const nsfwFilePath = path.join(__dirname, "..", "data", "nsfw-names.txt");

  if (!cachedData?.length) {
    try {
      cachedData = await parseTXT(filePath);
      filterTrie = createTrieNode();
      filterDict = new Set<string>();
      for (const row of cachedData) {
        insertIntoTrie(filterTrie, row.text);
        filterDict.add(row.text);
      }
    } catch (error) {
      throw new Error(
        `Initialization failed at <initializeFilterWords> for <slurs.txt>. ${error}`
      );
    }
  }

  if (!cachedNewWords?.length) {
    try {
      cachedNewWords = await parseTXT(nsfwFilePath);
      newWordsTree = createTrieNode();
      newWordsDict = new Set<string>();
      for (const row of cachedNewWords) {
        insertIntoTrie(newWordsTree, row.text);
        newWordsDict.add(row.text);
      }
    } catch (error) {
      throw new Error(
        `Initialization failed at <initializeFilterWords> for <nsfw-names.txt>. ${error}`
      );
    }
  }
};

const parseTXT = async (filePath: string): Promise<Row[]> => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => ({ text: line.trim() }));
  } catch (error) {
    throw new Error(`Error during <parseTXT> for <${filePath}>. ${error}`);
  }
};

const filterText = async (text: string, replace: string): Promise<string> => {
  try {
    if (!text) return text;
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (filterDict!.has(word) || searchInTrie(filterTrie!, word)) {
        words[i] = replace;
      }
    }
    return words.join(" ");
  } catch (error) {
    throw new Error(`Error during <filterText> for <${text}>. ${error}`);
  }
};

const scrape = async (url: Readonly<string>): Promise<{
  flaggedDomain: boolean;
  containsCensored: boolean;
  filteredTexts: string[];
}> => {

  const filePath = path.join(__dirname, "..", "data", "nsfw.txt");
  
  try {
    if (!cachedNSFW) {
      try {
        const rows = await parseTXT(filePath);
        cachedNSFW = rows.map((row) => row.text);
      } catch (error) {
        throw new Error(
          `Error during <initialize> for <${filePath}>. ${error}`
        );
      }
    }

    const nsfw = cachedNSFW;
    if (
      nsfw.includes(url.split("/")[0] === "www" ? url : url.split("/")[2])
    ) {
      return {
        flaggedDomain: true,
        containsCensored: false,
        filteredTexts: [],
      };
    }

    try {
      await initializeFilterWords();
    } catch (error) {
      throw new Error(`Error during <initializeFilterWords>. ${error instanceof Error ? error.stack : error}`);
    }

    let browser;
    try {
      puppeteer.use(StealthPlugin());
      puppeteer.use(AdblockerPlugin({
        blockTrackers: true,
      }));
      browser = await puppeteer.launch(<LaunchOptions>{
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        timeout: 0,
      });
    } catch (error) {
      console.error(`Puppeteer launch error: ${JSON.stringify(error)}`);
      throw new Error(`Error during <puppeteer.launch>. ${error instanceof Error ? error.stack : error}`);
    }

    let page;
    try {
      page = await browser.newPage();
    } catch (error) {
      throw new Error(`Error during <browser.newPage>. ${error}`);
    }

    let response;
    try {
      response = await page.goto(url, {
        timeout: 0,
        waitUntil: "domcontentloaded",
      });
    } catch (error) {
      throw new Error(`Error during <page.goto>. ${error}`);
    }

    await wait(5);

    const finalUrl = response?.url() || url;
    if (
      cachedNSFW.includes(
        finalUrl.split("/")[0] === "www" ? finalUrl : finalUrl.split("/")[2]
      )
    ) {
      try {
        await browser.close();
      } catch (error) {
        throw new Error(
          `Error during <scrape> for <browser.close>. ${error}`
        );
      }
      return {
        flaggedDomain: true,
        containsCensored: false,
        filteredTexts: [],
      };
    }

    let texts;
    try {
      texts = await page.evaluate(() => {
        const elements: Element[] = Array.from(
          document.querySelectorAll("p, div, span, a, h1, h2, h3, h4, h5, h6, li")
        );
        let filteredElements: string[] = elements
          .map((el) => el.textContent?.trim() || "")
          .filter((text) => text.length > 0);
        for (let i = 0; i < filteredElements.length; i++) {
          let text = filteredElements[i];
          text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, "");
          text = text.replace(/[^\x00-\x7F]/g, "");
          text = text.replace(/\s+/g, " ");
          text = text.replace(/[\n\r]+/g, " ");
          filteredElements[i] = text;
        }
        return filteredElements;
      });
    } catch (error) {
      throw new Error(`Error during <page.evaluate>. ${error}`);
    }

    try {
      await browser.close();
    } catch (error) {
      throw new Error(`Error during <browser.close>. ${error}`);
    }

    const processedTexts: string[] = texts.map(removeDuplicates);
    const hashSet: Set<string> = createHashSet(processedTexts);

    const filteredTexts: string[] = await Promise.all(
      Array.from(hashSet).map(
        async (text) => await filterText(text, "***")
      ),
    );

    const containsCensored: boolean = filteredTexts.some((text) =>
      text.includes("***"),
    );

    return {
      flaggedDomain: false,
      containsCensored: containsCensored,
      filteredTexts: filteredTexts,
    };
  } catch (error) {
    console.error(`Error during scraping: ${error instanceof Error ? error.stack : error}`);
    throw new Error(`Scraping failed at <scrape>. ${error instanceof Error ? error.stack : error}`);
  }
};

export { scrape, initializeFilterWords, filterText, parseTXT };