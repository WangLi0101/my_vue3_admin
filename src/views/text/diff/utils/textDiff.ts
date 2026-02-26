import * as jieba from "jieba-wasm";
import init from "jieba-wasm";
import * as Diff from "diff";

// jieba 初始化状态
let jiebaInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * 初始化 jieba-wasm
 */
export async function initJieba(): Promise<void> {
  if (jiebaInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await init();
      jiebaInitialized = true;
      console.log("jieba-wasm 初始化成功");
    } catch (error) {
      console.error("jieba-wasm 初始化失败:", error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * 通用文本分词（支持中文、英文、中英混合）
 *
 * 策略：
 * 1. 将文本按中文和非中文部分分割
 * 2. 中文部分使用 jieba 分词
 * 3. 英文部分按单词分割
 * 4. 最后进行归一化处理
 */
export function segmentText(text: string): string[] {
  if (!text || !text.trim()) return [];

  // 分离中文和非中文部分
  const segments = splitByLanguage(text);
  const allWords: string[] = [];

  for (const segment of segments) {
    if (segment.type === "chinese") {
      // 中文使用 jieba 分词
      if (jiebaInitialized) {
        try {
          const words = jieba.cut(segment.text, false);
          allWords.push(...words);
        } catch {
          // 失败时逐字分割
          allWords.push(...segment.text.split(""));
        }
      } else {
        // jieba 未初始化，逐字分割
        allWords.push(...segment.text.split(""));
      }
    } else if (segment.type === "english") {
      // 英文按单词分割
      const words = segment.text.split(/\s+/).filter(w => w.length > 0);
      allWords.push(...words);
    } else if (segment.type === "number") {
      // 数字作为整体
      allWords.push(segment.text);
    } else if (segment.type === "punctuation") {
      // 标点符号可选保留（这里选择过滤）
      // allWords.push(segment.text);
    }
  }

  // 归一化处理
  return normalizeWords(allWords);
}

/**
 * 按语言类型分割文本
 */
interface TextSegment {
  type: "chinese" | "english" | "number" | "punctuation" | "whitespace";
  text: string;
}

function splitByLanguage(text: string): TextSegment[] {
  const segments: TextSegment[] = [];

  // 正则匹配不同类型的文本
  // 中文字符范围: \u4e00-\u9fff (常用汉字)
  // 英文: a-zA-Z
  // 数字: 0-9
  const regex =
    /([\u4e00-\u9fff\u3400-\u4dbf]+)|([a-zA-Z]+(?:'[a-zA-Z]+)?)|(\d+(?:\.\d+)?)|([^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9\s]+)|(\s+)/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      segments.push({ type: "chinese", text: match[1] });
    } else if (match[2]) {
      segments.push({ type: "english", text: match[2] });
    } else if (match[3]) {
      segments.push({ type: "number", text: match[3] });
    } else if (match[4]) {
      segments.push({ type: "punctuation", text: match[4] });
    } else if (match[5]) {
      segments.push({ type: "whitespace", text: match[5] });
    }
  }

  return segments;
}

/**
 * 归一化词汇
 * - 英文转小写（大小写归一）
 * - 过滤空白和无意义字符
 * - 过滤单字符标点
 */
function normalizeWords(words: string[]): string[] {
  return words
    .map(word => word.toLowerCase().trim())
    .filter(word => {
      // 过滤空字符串
      if (!word) return false;
      // 过滤纯空白
      if (/^\s*$/.test(word)) return false;
      // 过滤纯标点符号
      if (
        /^[,.!?;:'"()[\]{}<>，。！？；：""''（）【】《》、—…·\-_]+$/.test(word)
      )
        return false;
      return true;
    });
}

/**
 * 计算余弦相似度
 * 基于词频向量的语义相似度
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = segmentText(text1);
  const words2 = segmentText(text2);

  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;

  // 构建词频 Map（性能优化）
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  words1.forEach(w => freq1.set(w, (freq1.get(w) || 0) + 1));
  words2.forEach(w => freq2.set(w, (freq2.get(w) || 0) + 1));

  // 合并所有词汇
  const allWords = new Set([...freq1.keys(), ...freq2.keys()]);

  // 计算点积和向量模
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allWords.forEach(word => {
    const v1 = freq1.get(word) || 0;
    const v2 = freq2.get(word) || 0;
    dotProduct += v1 * v2;
    magnitude1 += v1 * v1;
    magnitude2 += v2 * v2;
  });

  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);

  if (magnitude1 === 0 || magnitude2 === 0) return 0;

  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * 计算 Jaccard 相似度
 * 基于词集合交并比
 */
export function calculateJaccardSimilarity(
  text1: string,
  text2: string
): number {
  const words1 = new Set(segmentText(text1));
  const words2 = new Set(segmentText(text2));

  if (words1.size === 0 && words2.size === 0) return 1;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 1;

  return intersection.size / union.size;
}

export interface DiffPart {
  value: string;
  type: "same" | "added" | "removed";
}

/**
 * 比较两个文本的差异（基于分词）
 */
export function compareTexts(text1: string, text2: string): DiffPart[] {
  const words1 = segmentText(text1);
  const words2 = segmentText(text2);

  const changes = Diff.diffArrays(words1, words2);

  return changes.map(change => ({
    value: change.value.join(" "),
    type: change.added ? "added" : change.removed ? "removed" : "same"
  }));
}

/**
 * 比较两个文本的差异（逐字符）
 */
export function compareTextsChar(text1: string, text2: string): DiffPart[] {
  const changes = Diff.diffChars(text1, text2);

  return changes.map(change => ({
    value: change.value,
    type: change.added ? "added" : change.removed ? "removed" : "same"
  }));
}

/**
 * 高亮结果接口
 */
export interface HighlightResult {
  text1Parts: Array<{ text: string; isSame: boolean }>;
  text2Parts: Array<{ text: string; isSame: boolean }>;
  sameWords: string[];
  sameWordsCount: number;
  text1WordCount: number;
  text2WordCount: number;
}

/**
 * 高亮显示相同的词
 */
export function highlightSameWords(
  text1: string,
  text2: string
): HighlightResult {
  const words1 = segmentText(text1);
  const words2 = segmentText(text2);
  const words2Set = new Set(words2);
  const words1Set = new Set(words1);

  // 找出相同的词（去重）
  const sameWords = [...new Set(words1.filter(w => words2Set.has(w)))];

  // 为文本1标记
  const text1Parts = words1.map(word => ({
    text: word,
    isSame: words2Set.has(word)
  }));

  // 为文本2标记
  const text2Parts = words2.map(word => ({
    text: word,
    isSame: words1Set.has(word)
  }));

  // 计算相同词的出现次数
  const sameWordsCount = words1.filter(w => words2Set.has(w)).length;

  return {
    text1Parts,
    text2Parts,
    sameWords,
    sameWordsCount,
    text1WordCount: words1.length,
    text2WordCount: words2.length
  };
}

/**
 * 获取文本的分词结果（用于调试）
 */
export function getSegmentResult(text: string): {
  words: string[];
  count: number;
} {
  const words = segmentText(text);
  return {
    words,
    count: words.length
  };
}
