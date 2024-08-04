import puppeteer from "puppeteer-extra";
import { LaunchOptions } from "puppeteer";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";

interface Row {
  text: string;
}

class TrieNode {
  children: { [key: string]: TrieNode } = {};
  isEndOfWord: boolean = false;
}

class Trie {
  private root: TrieNode = new TrieNode();

  public insert(word: string): void {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.isEndOfWord = true;
  }

  public search(word: string): boolean {
    let node = this.root;
    for (const char of word) {
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    return node.isEndOfWord;
  }

  public startsWith(prefix: string): boolean {
    let node = this.root;
    for (const char of prefix) {
      if (!node.children[char]) {
        return false;
      }
      node = node.children[char];
    }
    return true;
  }
}

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

const readFileAsync = promisify(fs.readFile);

class Scraper {
  private cachedData: Row[] | null = null;
  private cachedNewWords: Row[] | null = null;
  private filterTrie: Trie | null = null;
  private filterDict: Set<string> | null = null;
  private newWordsTree: Trie | null = null;
  private newWordsDict: Set<string> | null = null;
  private cachedNSFW: string[] | null = null;

  constructor() {
    puppeteer.use(StealthPlugin());
    puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
  }

  public async initialize(): Promise<void> {
    try {
      await this.initializeFilterWords();
    } catch (error) {
      throw new Error(
        `Initialization failed at <initialize> for <initializeFilterWords>. ${error}`,
      );
    }
  }

  private async initializeFilterWords(): Promise<void> {
    const filePath = path.join(__dirname, "data", "slurs.txt");
    const nsfwFilePath = path.join(__dirname, "data", "nsfw-names.txt");

    if (!this.cachedData?.length) {
      try {
        this.cachedData = await this.parseTXT(filePath);
        this.filterTrie = new Trie();
        this.filterDict = new Set<string>();
        for (const row of this.cachedData) {
          this.filterTrie.insert(row.text);
          this.filterDict.add(row.text);
        }
      } catch (error) {
        throw new Error(
          `Initialization failed at <initializeFilterWords> for <slurs.txt>. ${error}`,
        );
      }
    }

    if (!this.cachedNewWords?.length) {
      try {
        this.cachedNewWords = await this.parseTXT(nsfwFilePath);
        this.newWordsTree = new Trie();
        this.newWordsDict = new Set<string>();
        for (const row of this.cachedNewWords) {
          this.newWordsTree.insert(row.text);
          this.newWordsDict.add(row.text);
        }
      } catch (error) {
        throw new Error(
          `Initialization failed at <initializeFilterWords> for <nsfw-names.txt>. ${error}`,
        );
      }
    }
  }

  private async parseTXT(filePath: string): Promise<Row[]> {
    try {
      const data = await readFileAsync(filePath, "utf8");
      return data
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => ({ text: line.trim() }));
    } catch (error) {
      throw new Error(`Error during <parseTXT> for <${filePath}>. ${error}`);
    }
  }

  private async filterText(text: string, replace: string): Promise<string> {
    try {
      if (!text) return text;
      const words = text.split(" ");
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (this.filterDict!.has(word) || this.filterTrie!.search(word)) {
          words[i] = replace;
        } else if (
          this.newWordsDict!.has(word) ||
          this.newWordsTree!.startsWith(word)
        ) {
          words[i] = replace;
        }
      }
      return words.join(" ");
    } catch (error) {
      throw new Error(`Error during <filterText> for <${text}>. ${error}`);
    }
  }

  public async scrape(url: Readonly<string>): Promise<{
    flaggedDomain: boolean;
    containsCensored: boolean;
    filteredTexts: string[];
  }> {
    const filePath = path.join(__dirname, "data", "nsfw.txt");

    try {
      if (!this.cachedNSFW) {
        try {
          const rows = await this.parseTXT(filePath);
          this.cachedNSFW = rows.map((row) => row.text);
        } catch (error) {
          throw new Error(
            `Error during <initialize> for <${filePath}>. ${error}`,
          );
        }
      }

      const nsfw = this.cachedNSFW;
      if (
        nsfw.includes(url.split("/")[0] === "www" ? url : url.split("/")[2])
      ) {
        return {
          flaggedDomain: true,
          containsCensored: false,
          filteredTexts: [],
        };
      }

      await this.initialize();

      const browser = await puppeteer.launch(<LaunchOptions>{
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        timeout: 0,
      });

      const page = await browser.newPage();
      const response = await page.goto(url, {
        timeout: 0,
        waitUntil: "domcontentloaded",
      });

      await wait(5);

      const finalUrl = response?.url() || url;
      if (
        this.cachedNSFW.includes(
          finalUrl.split("/")[0] === "www" ? finalUrl : finalUrl.split("/")[2],
        )
      ) {
        try {
          await browser.close();
        } catch (error) {
          throw new Error(
            `Error during <scrape> for <browser.close>. ${error}`,
          );
        }
        return {
          flaggedDomain: true,
          containsCensored: false,
          filteredTexts: [],
        };
      }

      const texts = await page.evaluate(() => {
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

      await browser.close();

      const processedTexts = texts.map(removeDuplicates);
      const hashSet = createHashSet(processedTexts);

      const filteredTexts = await Promise.all(
        Array.from(hashSet).map(
          async (text) => await this.filterText(text, "***"),
        ),
      );

      const containsCensored = filteredTexts.some((text) =>
        text.includes("***"),
      );

      return {
        flaggedDomain: false,
        containsCensored: containsCensored,
        filteredTexts: filteredTexts,
      };
    } catch (error) {
      throw new Error(`Scraping failed at <scrape>. ${error}`);
    }
  }
}

export default Scraper;
