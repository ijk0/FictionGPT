import type { WritingStyle } from '@/lib/types/project';

export interface StyleConfig {
  id: WritingStyle;
  label: string;
  description: string;
  promptModifier: string;
}

export const WRITING_STYLES: Record<WritingStyle, StyleConfig> = {
  literary: {
    id: 'literary',
    label: '严肃文学',
    description: '注重文学性、心理描写和主题深度',
    promptModifier: `写作风格要求：严肃文学
- 使用丰富的文学修辞，善用比喻、象征和意象
- 注重人物内心世界的深入刻画，心理描写细腻
- 语言优雅精致，句式富于变化
- 叙事节奏可以舒缓，注重留白和暗示
- 主题深刻，关注人性、社会和存在主义议题
- 避免过度戏剧化，追求真实感和文学质感`,
  },
  webnovel: {
    id: 'webnovel',
    label: '网络小说',
    description: '节奏明快、爽点密集、追更体验',
    promptModifier: `写作风格要求：网络小说
- 节奏明快，每章都有爽点或钩子
- 段落短小精悍，适合快速阅读
- 章节末尾要设置悬念或反转
- 对话生动有趣，减少大段描写
- 角色成长线清晰，有明确的升级/进步体系
- 冲突频繁且解决方式让读者有爽快感
- 适当使用网络小说常见的叙事手法`,
  },
  mystery: {
    id: 'mystery',
    label: '悬疑推理',
    description: '布局精巧、线索隐藏、层层揭秘',
    promptModifier: `写作风格要求：悬疑推理
- 精心布置线索和红鲱鱼（误导性线索）
- 控制信息揭露的节奏，层层递进
- 营造紧张悬疑的氛围
- 环境描写服务于气氛营造
- 遵循公平推理原则，所有线索对读者可见
- 每章设置小悬念，推动读者继续阅读
- 角色行为逻辑自洽，动机合理`,
  },
  scifi: {
    id: 'scifi',
    label: '科幻',
    description: '科学设定严谨、未来想象丰富',
    promptModifier: `写作风格要求：科幻小说
- 科学设定要有内在逻辑性和自洽性
- 通过情节和对话自然展现世界观，避免大段说明
- 探索技术对人类和社会的深层影响
- 平衡硬核设定与人物情感
- 场景描写要有未来感和画面感
- 关注"如果...会怎样"的思想实验`,
  },
  fantasy: {
    id: 'fantasy',
    label: '奇幻',
    description: '宏大世界观、魔法体系、史诗叙事',
    promptModifier: `写作风格要求：奇幻小说
- 构建沉浸式的奇幻世界，魔法体系有规则和代价
- 世界观通过叙事自然呈现，不做生硬的百科式介绍
- 战斗场景生动有力，有画面感
- 平衡宏大叙事与角色的个人故事
- 语言可以略微古典化但不晦涩
- 注重不同种族/文化的差异化描写`,
  },
  romance: {
    id: 'romance',
    label: '言情',
    description: '情感细腻、关系发展、甜虐交织',
    promptModifier: `写作风格要求：言情小说
- 以感情线为核心驱动力
- 细腻描写人物的情感变化和内心挣扎
- 通过互动和对话展现角色化学反应
- 制造浪漫时刻，同时保持真实感
- 合理设置感情发展中的障碍和误会
- 甜蜜和虐心段落交替，节奏有张有弛`,
  },
  custom: {
    id: 'custom',
    label: '自定义',
    description: '用户自定义写作风格',
    promptModifier: '',
  },
};

export function getStyleModifier(
  style: WritingStyle,
  customDesc?: string
): string {
  if (style === 'custom' && customDesc) {
    return `写作风格要求：自定义风格\n${customDesc}`;
  }
  return WRITING_STYLES[style].promptModifier;
}
