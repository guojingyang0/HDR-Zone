
import { ZoneType } from '../types';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    title: "WES 6.10 HDR",
    subtitle: "color adjust mathematical model",
    inactive: "Select a Zone",
    activeCurve: "Active Curve",
    view2D: "2D Curve",
    view3D: "3D Topology",
    viewImage: "Image Preview",
    importImage: "Import Image",
    exportImage: "Export Result",
    processing: "Processing...",
    dragDrop: "Drag & Drop image here",
    yAxis: "Y: Output",
    xAxis: "X: Input (EV)",
    zoneDefinitions: "Zone Parameters",
    zoneDefDesc: "Adjust <strong>Range</strong> (cutoff) and <strong>Falloff</strong> (softness) to define the zone's shape.",
    rangeLimit: "Range",
    rangeUnlock: "Unlock full range (-6 to +6)",
    rangeLock: "Lock to recommended range",
    falloff: "Falloff",
    low: "LOW",
    high: "HIGH",
    toggleDirection: "Toggle Direction (Low Pass / High Pass)",
    colorWheels: "Grading Wheels",
    wheelDesc: "Select a wheel to see its definition and usage guide.",
    reset: "Reset",
    exp: "Exp",
    sat: "Sat",
    blackPoint: "Black",
    grayRamp: "Zone Coverage Map",
    whitePoint: "White",
    original: "IN",
    gradedOutput: "OUT",
    presets: {
      title: "Learning Scenarios",
      reset: "Flat / Reset",
      contrast: "High Contrast (S-Curve)",
      recoverSky: "Recover Blown Highlights",
      liftShadows: "Lift Deep Shadows",
      softRoll: "Soft Rolloff"
    },
    guide: {
      title: "Zone Guide",
      scope: "Scope",
      examples: "Typical Objects",
      usage: "Common Usage",
      selectPrompt: "Click on a Color Wheel to view its definition and application advice."
    },
    math: {
      title: "Mathematical Principles",
      formula: "Formula",
      weightFunction: "Weight Function (Hermite)",
      weightDesc: "Determines the influence of a zone based on input luminance.",
      outputFunction: "Signal Aggregation",
      outputDesc: "Final output is the additive sum of all zone adjustments in Log space.",
      variables: {
        x: "Input Luminance (EV)",
        y: "Output Luminance",
        w: "Zone Weight (0-1)",
        e: "Exposure Adjustment",
        r: "Range Limit",
        f: "Falloff Factor"
      }
    },
    zones: {
        [ZoneType.BLACK]: "Black",
        [ZoneType.DARK]: "Dark",
        [ZoneType.SHADOW]: "Shadow",
        [ZoneType.LIGHT]: "Light",
        [ZoneType.HIGHLIGHT]: "Highlight",
        [ZoneType.SPECULAR]: "Specular"
    },
    zoneInfo: {
      [ZoneType.BLACK]: {
        scope: "Deep Blacks (< -4.0 EV)",
        examples: "Deepest shadows, pure black point",
        usage: "Defines the absolute floor. Adjust to crush blacks or lift the noise floor. Interacts with Dark."
      },
      [ZoneType.DARK]: {
        scope: "Shadows (< -1.5 EV)",
        examples: "Shadows in folds of clothes, hair, dark corners",
        usage: "Broad control for shadow density. Overlaps with Black and Shadow."
      },
      [ZoneType.SHADOW]: {
        scope: "Lower Mids (< 1.0 EV)",
        examples: "Faces in shadow, indoor walls",
        usage: "The broadest 'dark' control. Affects everything from black up to mid-gray."
      },
      [ZoneType.LIGHT]: {
        scope: "Upper Mids (> -1.0 EV)",
        examples: "Skin tones, outdoor ambient light",
        usage: "Broadest 'bright' control. The counterpart to Shadow. Adjust for global brightness feel."
      },
      [ZoneType.HIGHLIGHT]: {
        scope: "Brights (> 1.5 EV)",
        examples: "Sky, clouds, white shirts",
        usage: "Targets bright areas without affecting skin tones. Essential for sky recovery."
      },
      [ZoneType.SPECULAR]: {
        scope: "Super Highlights (> 4.0 EV)",
        examples: "Sun reflections, catchlights, metal glint",
        usage: "Targets only the most intense light sources. Use to fix clipping or soften digital sharpness."
      }
    }
  },
  zh: {
    title: "WES 6.10 HDR",
    subtitle: "color adjust mathematical model",
    inactive: "请选择一个分区",
    activeCurve: "当前曲线",
    view2D: "2D 曲线视图",
    view3D: "3D 拓扑视图",
    viewImage: "图像调色预览",
    importImage: "导入图像",
    exportImage: "导出结果",
    processing: "处理中...",
    dragDrop: "拖拽图片到此处或点击上传",
    yAxis: "Y轴: 输出亮度",
    xAxis: "X轴: 输入亮度 (EV)",
    zoneDefinitions: "分区参数 (Zone Parameters)",
    zoneDefDesc: "调节 <strong>范围 (Range)</strong> 和 <strong>衰减 (Falloff)</strong> 来定义分区的数学形状。",
    rangeLimit: "范围",
    rangeUnlock: "解锁全范围 (-6 到 +6)",
    rangeLock: "锁定至推荐范围",
    falloff: "衰减",
    low: "低通",
    high: "高通",
    toggleDirection: "切换方向 (低通 / 高通)",
    colorWheels: "调色轮 (Grading Wheels)",
    wheelDesc: "点击任意色轮，查看其定义和使用场景指南。",
    reset: "重置",
    exp: "曝光",
    sat: "饱和",
    blackPoint: "黑点",
    grayRamp: "分区覆盖范围示意图",
    whitePoint: "白点",
    original: "输入",
    gradedOutput: "输出",
    presets: {
      title: "学习场景预设",
      reset: "默认 / 平直",
      contrast: "高对比度 (S型曲线)",
      recoverSky: "修复天空过曝 (Highlight修复)",
      liftShadows: "提亮暗部细节 (Shadow提亮)",
      softRoll: "柔和高光滚落"
    },
    guide: {
      title: "分区向导 (Zone Guide)",
      scope: "覆盖范围",
      examples: "典型物体",
      usage: "常见用途",
      selectPrompt: "请点击右侧任意一个调色轮，查看该分区的具体定义和调节建议。"
    },
    math: {
      title: "数学原理 (Mathematical Principles)",
      formula: "核心公式",
      weightFunction: "权重函数 (Hermite插值)",
      weightDesc: "基于输入亮度计算当前分区的权重系数(0.0 - 1.0)，决定了调节的柔和度。",
      outputFunction: "信号聚合 (Signal Aggregation)",
      outputDesc: "最终输出是所有分区调节值在对数空间(Log Space)中的加性叠加。",
      variables: {
        x: "输入亮度 (Input EV)",
        y: "输出亮度 (Output)",
        w: "分区权重 (Weight)",
        e: "曝光调节值 (Exposure)",
        r: "范围限制 (Range)",
        f: "衰减因子 (Falloff)"
      }
    },
    zones: {
        [ZoneType.BLACK]: "黑 (Black)",
        [ZoneType.DARK]: "暗 (Dark)",
        [ZoneType.SHADOW]: "阴影 (Shadow)",
        [ZoneType.LIGHT]: "亮 (Light)",
        [ZoneType.HIGHLIGHT]: "高光 (Highlight)",
        [ZoneType.SPECULAR]: "镜面 (Specular)"
    },
    zoneInfo: {
      [ZoneType.BLACK]: {
        scope: "极暗部 (< -4.0 EV)",
        examples: "深邃的阴影、纯黑背景、夜景暗角",
        usage: "设定画面的“底”。降低它能让画面看起来更扎实、黑色更纯净。"
      },
      [ZoneType.DARK]: {
        scope: "暗部 (< -1.5 EV)",
        examples: "衣服褶皱中的阴影、发丝暗部、角落",
        usage: "控制阴影的“厚度”。通常与Black和Shadow配合使用。"
      },
      [ZoneType.SHADOW]: {
        scope: "中灰以下 (< 1.0 EV)",
        examples: "背光的人脸、室内墙壁的阴影面",
        usage: "范围最广的暗部控制。调节它可以改变整个画面的对比度基调。"
      },
      [ZoneType.LIGHT]: {
        scope: "中灰以上 (> -1.0 EV)",
        examples: "受光的人脸皮肤、户外的草地、路面",
        usage: "范围最广的亮部控制。与Shadow对应，通常用于提升画面整体亮度感。"
      },
      [ZoneType.HIGHLIGHT]: {
        scope: "亮部 (> 1.5 EV)",
        examples: "天空、白云、白色衬衫、明亮的窗户",
        usage: "只影响较亮的区域，不影响肤色。常用于压暗过曝的天空。"
      },
      [ZoneType.SPECULAR]: {
        scope: "极亮部 (> 4.0 EV)",
        examples: "太阳反光、眼睛里的眼神光、金属高光",
        usage: "针对画面中最刺眼的部分。可以用来找回极亮处的细节或柔化高光。"
      }
    }
  }
};
