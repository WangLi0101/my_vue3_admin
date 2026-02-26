<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import {
  Search,
  Document,
  Delete,
  Loading,
  ArrowDown
} from "@element-plus/icons-vue";
import {
  initJieba,
  calculateSimilarity,
  calculateJaccardSimilarity,
  highlightSameWords,
  type HighlightResult
} from "./utils/textDiff";

defineOptions({
  name: "TextDiff"
});

// 状态
const text1 = ref("");
const text2 = ref("");
const loading = ref(false);
const jiebaLoading = ref(true);
const compared = ref(false);

// 结果
const cosineSimilarity = ref(0);
const jaccardSimilarity = ref(0);
const highlightResult = ref<HighlightResult | null>(null);

// 计算相似度百分比展示
const cosinePercent = computed(() => Math.round(cosineSimilarity.value * 100));
const jaccardPercent = computed(() =>
  Math.round(jaccardSimilarity.value * 100)
);

// 根据相似度返回颜色
const getSimilarityColor = (percent: number) => {
  if (percent >= 80) return "#f56c6c"; // 红色 - 高相似度
  if (percent >= 60) return "#e6a23c"; // 橙色
  if (percent >= 40) return "#409eff"; // 蓝色
  return "#67c23a"; // 绿色 - 低相似度
};

// 初始化 jieba
onMounted(async () => {
  try {
    await initJieba();
    jiebaLoading.value = false;
    ElMessage.success("分词引擎初始化成功");
  } catch (error) {
    jiebaLoading.value = false;
    ElMessage.warning("分词引擎初始化失败，将使用备用分词方案");
  }
});

// 执行比较
const handleCompare = () => {
  if (!text1.value.trim() || !text2.value.trim()) {
    ElMessage.warning("请输入两篇文章进行比较");
    return;
  }

  loading.value = true;

  // 使用 setTimeout 让 UI 有机会更新
  setTimeout(() => {
    try {
      // 计算相似度
      cosineSimilarity.value = calculateSimilarity(text1.value, text2.value);
      jaccardSimilarity.value = calculateJaccardSimilarity(
        text1.value,
        text2.value
      );

      // 高亮相同词
      highlightResult.value = highlightSameWords(text1.value, text2.value);

      compared.value = true;
      ElMessage.success("比较完成");
    } catch (error) {
      ElMessage.error("比较失败：" + (error as Error).message);
    } finally {
      loading.value = false;
    }
  }, 100);
};

// 清空
const handleClear = () => {
  text1.value = "";
  text2.value = "";
  compared.value = false;
  cosineSimilarity.value = 0;
  jaccardSimilarity.value = 0;
  highlightResult.value = null;
};

// 示例类型
type ExampleType = "chinese" | "english" | "mixed";

// 示例文本数据
const examples: Record<ExampleType, { text1: string; text2: string }> = {
  chinese: {
    text1: `人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。
人工智能的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。
自人工智能诞生以来，其理论和技术日益成熟，应用领域也不断扩大。`,
    text2: `人工智能是计算机科学领域的重要分支，旨在理解智能的本质，并创造出能够模拟人类智能行为的智能系统。
人工智能的研究领域涵盖机器人技术、语音识别、图像处理、自然语言理解和知识工程等多个方向。
随着人工智能技术的不断发展和成熟，其应用范围持续扩展。`
  },
  english: {
    text1: `Artificial intelligence is a branch of computer science that attempts to understand the essence of intelligence and produce intelligent machines that can respond in ways similar to human intelligence.
AI research includes robotics, speech recognition, image recognition, natural language processing and expert systems.
Since the birth of artificial intelligence, its theory and technology have become increasingly mature.`,
    text2: `Artificial intelligence is an important branch of computer science that aims to understand the nature of intelligence and create intelligent systems capable of simulating human intelligent behavior.
AI research covers multiple areas including robotics, voice recognition, image processing, natural language understanding and knowledge engineering.
With the continuous development of artificial intelligence technology, its applications continue to expand.`
  },
  mixed: {
    text1: `AI人工智能是Computer Science计算机科学的重要分支。
Machine Learning机器学习和Deep Learning深度学习是AI的核心技术。
目前，ChatGPT、Claude等Large Language Model大语言模型正在改变世界。
Python和TensorFlow是开发AI应用的常用工具。`,
    text2: `人工智能AI是计算机科学Computer Science领域的重要方向。
深度学习Deep Learning和机器学习Machine Learning是人工智能的关键技术。
当前，大语言模型Large Language Model如GPT、Claude正在革新各个行业。
TensorFlow和PyTorch是AI开发的主流框架。`
  }
};

// 加载示例
const loadExample = (type: ExampleType = "mixed") => {
  const example = examples[type];
  text1.value = example.text1;
  text2.value = example.text2;
};
</script>

<template>
  <div class="text-diff-container">
    <!-- 标题区域 -->
    <div class="header">
      <h1 class="title">
        <span class="icon">📝</span>
        文本相似度比较
      </h1>
      <p class="subtitle">使用 jieba-wasm 分词 + 余弦相似度算法</p>
      <div v-if="jiebaLoading" class="loading-tip">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在加载分词引擎...</span>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-section">
      <div class="text-input-wrapper">
        <div class="input-header">
          <span class="label">文章一</span>
          <span class="char-count">{{ text1.length }} 字</span>
        </div>
        <el-input
          v-model="text1"
          type="textarea"
          :rows="8"
          placeholder="请输入第一篇文章..."
          resize="none"
          class="text-input"
        />
      </div>

      <div class="vs-divider">
        <span>VS</span>
      </div>

      <div class="text-input-wrapper">
        <div class="input-header">
          <span class="label">文章二</span>
          <span class="char-count">{{ text2.length }} 字</span>
        </div>
        <el-input
          v-model="text2"
          type="textarea"
          :rows="8"
          placeholder="请输入第二篇文章..."
          resize="none"
          class="text-input"
        />
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button
        type="primary"
        size="large"
        :loading="loading"
        @click="handleCompare"
      >
        <template #icon>
          <Search />
        </template>
        开始比较
      </el-button>
      <el-dropdown @command="loadExample">
        <el-button size="large">
          <template #icon>
            <Document />
          </template>
          加载示例
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="mixed">🔀 中英混合</el-dropdown-item>
            <el-dropdown-item command="chinese">🇨🇳 纯中文</el-dropdown-item>
            <el-dropdown-item command="english">🇺🇸 纯英文</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button size="large" @click="handleClear">
        <template #icon>
          <Delete />
        </template>
        清空
      </el-button>
    </div>

    <!-- 结果区域 -->
    <div v-if="compared" class="result-section">
      <!-- 相似度统计 -->
      <div class="similarity-cards">
        <div class="similarity-card">
          <div class="card-title">余弦相似度</div>
          <div class="card-value">
            <el-progress
              type="dashboard"
              :percentage="cosinePercent"
              :color="getSimilarityColor(cosinePercent)"
              :width="120"
            >
              <template #default>
                <span class="percentage-value">{{ cosinePercent }}%</span>
              </template>
            </el-progress>
          </div>
          <div class="card-desc">基于词频向量的语义相似度</div>
        </div>

        <div class="similarity-card">
          <div class="card-title">Jaccard 相似度</div>
          <div class="card-value">
            <el-progress
              type="dashboard"
              :percentage="jaccardPercent"
              :color="getSimilarityColor(jaccardPercent)"
              :width="120"
            >
              <template #default>
                <span class="percentage-value">{{ jaccardPercent }}%</span>
              </template>
            </el-progress>
          </div>
          <div class="card-desc">基于词集合交并比的相似度</div>
        </div>

        <div v-if="highlightResult" class="similarity-card stats-card">
          <div class="card-title">统计信息</div>
          <div class="stats-content">
            <div class="stat-item">
              <span class="stat-label">相同词汇数</span>
              <span class="stat-value">{{
                highlightResult.sameWords.length
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">文章一词数</span>
              <span class="stat-value">{{
                highlightResult.text1Parts.length
              }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">文章二词数</span>
              <span class="stat-value">{{
                highlightResult.text2Parts.length
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 高亮结果 -->
      <div v-if="highlightResult" class="highlight-section">
        <h3 class="section-title">
          <span class="icon">🎨</span>
          相似内容高亮
        </h3>
        <div class="legend">
          <span class="legend-item same">
            <span class="dot" />
            相同词汇
          </span>
          <span class="legend-item diff">
            <span class="dot" />
            不同词汇
          </span>
        </div>

        <div class="highlight-container">
          <div class="highlight-box">
            <div class="box-header">文章一</div>
            <div class="box-content">
              <span
                v-for="(part, index) in highlightResult.text1Parts"
                :key="index"
                :class="['word', { same: part.isSame, diff: !part.isSame }]"
                >{{ part.text }}</span
              >
            </div>
          </div>

          <div class="highlight-box">
            <div class="box-header">文章二</div>
            <div class="box-content">
              <span
                v-for="(part, index) in highlightResult.text2Parts"
                :key="index"
                :class="['word', { same: part.isSame, diff: !part.isSame }]"
                >{{ part.text }}</span
              >
            </div>
          </div>
        </div>
      </div>

      <!-- 相同词汇列表 -->
      <div
        v-if="highlightResult && highlightResult.sameWords.length > 0"
        class="same-words-section"
      >
        <h3 class="section-title">
          <span class="icon">📋</span>
          相同词汇列表
        </h3>
        <div class="words-cloud">
          <el-tag
            v-for="word in highlightResult.sameWords"
            :key="word"
            size="large"
            effect="plain"
            class="word-tag"
          >
            {{ word }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.text-diff-container {
  min-height: 100%;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
}

.header {
  text-align: center;
  margin-bottom: 32px;

  .title {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 8px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .icon {
      margin-right: 8px;
    }
  }

  .subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    margin: 0;
  }

  .loading-tip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    color: #fff;
    font-size: 14px;
  }
}

.input-section {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  align-items: stretch;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.text-input-wrapper {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);

  .input-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .label {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .char-count {
      font-size: 12px;
      color: #909399;
    }
  }

  .text-input {
    :deep(.el-textarea__inner) {
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.8;

      &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
    }
  }
}

.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #667eea;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    span {
      margin: 8px 0;
    }
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;

  .el-button {
    border-radius: 12px;
    padding: 12px 32px;
    font-weight: 600;

    &--primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;

      &:hover {
        opacity: 0.9;
      }
    }

    &:not(.el-button--primary) {
      background: rgba(255, 255, 255, 0.9);
      border: none;
      color: #606266;

      &:hover {
        background: #fff;
        color: #667eea;
      }
    }
  }
}

.result-section {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.similarity-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.similarity-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 20px;
  }

  .card-value {
    margin-bottom: 16px;

    .percentage-value {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
    }
  }

  .card-desc {
    font-size: 12px;
    color: #909399;
  }

  &.stats-card {
    .stats-content {
      padding: 16px 0;
    }

    .stat-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .stat-label {
        color: #606266;
      }

      .stat-value {
        font-weight: 600;
        color: #667eea;
        font-size: 18px;
      }
    }
  }
}

.highlight-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;

  .icon {
    font-size: 24px;
  }
}

.legend {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #606266;

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    &.same .dot {
      background: linear-gradient(135deg, #67c23a 0%, #95d475 100%);
    }

    &.diff .dot {
      background: #dcdfe6;
    }
  }
}

.highlight-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.highlight-box {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;

  .box-header {
    padding: 12px 16px;
    background: #f5f7fa;
    font-weight: 600;
    color: #303133;
    border-bottom: 1px solid #e4e7ed;
  }

  .box-content {
    padding: 16px;
    line-height: 2;
    max-height: 400px;
    overflow-y: auto;

    .word {
      display: inline;
      padding: 2px 0;
      border-radius: 3px;
      transition: all 0.2s;

      &.same {
        background: linear-gradient(
          135deg,
          rgba(103, 194, 58, 0.3) 0%,
          rgba(149, 212, 117, 0.3) 100%
        );
        color: #2d5016;
        font-weight: 500;
      }

      &.diff {
        color: #606266;
      }
    }
  }
}

.same-words-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.words-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  .word-tag {
    border-radius: 20px;
    font-size: 14px;
    border-color: #667eea;
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);

    &:hover {
      background: rgba(102, 126, 234, 0.2);
    }
  }
}
</style>
