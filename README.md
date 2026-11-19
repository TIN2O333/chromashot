# ChromaShot

一款以「拍」为核心的调色相机：从任何一张图里提取风格，把它变成可编辑的调色 DNA，再带着参考图去复刻同样的构图。

> 当前为 UI 演示版本（Expo + React Native），仿色与复刻均为端侧轻量实现，无服务端依赖。

## 功能

### 相机
- 实时取景，内置滤镜实时预览（曝光、对比、饱和度、色温、色调、褪色）
- 滤镜强度无级调节，底部胶片条快速切换
- 前后置切换、闪光灯开关

### 滤镜库
- 内置预设滤镜，按分类浏览
- 实时调色预览与一键套用

### 风格提取
- 从相册选图或使用示例图，端侧分析色彩分布并生成风格参数
- 展示主色板、影调参数与调色结果对比

### 我的滤镜
- 保存、套用、删除自定义风格
- 每个风格保留主色板与创建信息

### 复刻拍摄（差异化功能）
- 参考图先被提取成**结构骨架**：灰度 + Sobel 边缘 + 双阈值分层 + 梯度方向非极大值抑制，强边缘画主线、弱边缘画细节，并框出主体能量区域
- 鬼影层可交互：单指拖动、双指缩放/旋转、双击复位，支持镜像翻转，参考透明度常驻滑杆
- 自动对位：相机定时抓取低清帧，与参考图做灰度模板匹配（ZNCC + 小角度旋转搜索），输出构图相似度、平移量与旋转偏差
- HUD 用环形进度 + 四向箭头 + 可执行指令（如「向右平移 8% · 抬高 3°」）引导，越接近吻合触觉反馈越密
- 支持「轮廓 / 彩色」两种鬼影模式与「自动 / 手动」对位切换；锁定后鬼影不可拖动，只能移动手机去贴合
- 参考图同时生成色彩统计，取景时用叠层近似预览参考色调，拍摄时用 17³ 3D LUT 对实拍照片做真实色彩迁移
- 拍完进入对比页：并排 / 叠合（可调透明度）/ 骨架叠加三种视图，附构图相似度与「已套参考色」标记

### 风格 DNA（差异化功能）
- 用雷达图可视化六项调色基因：曝光、对比、饱和度、色温、色调、褪色
- 拖动滑块实时预览调色结果
- 自动生成自然语言解读，例如「整体压暗，画面偏暖，色彩浓郁」
- 支持重置与另存为新滤镜

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Expo SDK 58 / React Native 0.88 / React 19 |
| 语言 | TypeScript |
| 相机 | expo-camera |
| 传感器 | expo-sensors（DeviceMotion） |
| 图像处理 | expo-image-manipulator + jpeg-js（像素解码、模板匹配、3D LUT 色彩迁移） |
| 渲染 | react-native-svg（骨架与雷达图）、expo-linear-gradient（调色叠层） |
| 交互 | expo-haptics（触觉反馈）、PanResponder（鬼影拖动 / 缩放 / 旋转） |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npx expo start

# 手机真机预览（局域网不通时用隧道模式）
npx expo start --tunnel
```

用手机上的 **Expo Go** 扫描终端或浏览器页面中的二维码即可预览；也可以按 `w` 在浏览器查看 Web 版本。

> 真机预览时若提示账号不一致，可退出 Expo Go 登录使用匿名模式，或直接使用 tunnel 模式。

## 安装到 iPhone（未签名 IPA）

没有付费 Apple 开发者账号也能装：仓库内置 GitHub Actions 流水线，在 macOS runner 上编译未签名 IPA，再用免费 Apple ID 侧载。

### 1. 获取 IPA

打开仓库的 **Actions → iOS unsigned IPA → 最近一次成功运行**，在页面底部 `Artifacts` 中下载 `ChromaShot-unsigned-ipa`，解压得到 `ChromaShot-unsigned.ipa`。

也可以在本地手动触发：Actions 页面右上角 `Run workflow`。

### 2. 侧载到手机

1. 电脑安装 [Sideloadly](https://sideloadly.io/) 与 [iTunes](https://www.apple.com/itunes/)（必须用 Apple 官网版本，不要用 Microsoft Store 版，否则识别不到设备）
2. iPhone 用数据线连电脑，解锁并点「信任此电脑」
3. 把 `.ipa` 拖进 Sideloadly，`Apple ID` 填自己的免费账号，点 `Start`
4. 首次安装后，在 iPhone 的 **设置 → 通用 → VPN 与设备管理** 中信任对应的开发者描述文件
5. iOS 16 及以上还需在 **设置 → 隐私与安全性 → 开发者模式** 中打开开发者模式并重启手机

### 3. 注意事项

- 免费 Apple ID 签名的应用 **7 天过期**，到期需重新侧载一次
- 同一个免费账号最多同时安装 3 个自签应用
- 应用最低要求 **iOS 16.0**，设备需为 arm64（iPhone 5s 及以后）
- 流水线使用 `macos-26` + Xcode 26，因为 RN 0.88 的 Codegen 产物要求 Swift 6.2

## 安装到 Android（APK）

Android 不需要账号或侧载工具，直接装 APK 即可。

### 1. 获取 APK

打开仓库的 **Actions → Android APK → 最近一次成功运行**，在页面底部 `Artifacts` 中下载 `ChromaShot-apk`，解压得到 `ChromaShot.apk`。

### 2. 安装

1. 把 `.apk` 传到手机（数据线、网盘、微信文件传输均可）
2. 点击安装，系统提示时允许「安装未知来源应用」
3. 首次打开会申请相机权限，允许后即可使用

### 3. 注意事项

- 使用 debug 签名，可覆盖安装后续版本；若提示签名冲突，先卸载旧版再装
- 通用包包含 `arm64-v8a / armeabi-v7a / x86 / x86_64` 四种 ABI，体积约 93 MB
- 已屏蔽 `RECORD_AUDIO` 权限，应用只拍照不录音

## 项目结构

```
chromashot/
├── App.tsx                  # 根组件、页面路由与全局状态
├── src/
│   ├── assets.ts            # 示例图资源
│   ├── theme.ts             # 颜色、字号、间距
│   ├── types.ts             # Lut / Analysis 等类型
│   ├── components/
│   │   ├── GradeOverlay.tsx # 调色叠层（实时预览）
│   │   ├── RadarChart.tsx   # 风格 DNA 雷达图
│   │   ├── ReplicaGuide.tsx # 复刻鬼影（拖动 / 缩放 / 旋转 / 镜像）与边缘光
│   │   ├── ReplicaHud.tsx   # 环形相似度、方向箭头、可执行指令、锁定
│   │   ├── ReplicaResult.tsx# 拍摄后对比（并排 / 叠合 / 骨架）
│   │   └── ...
│   ├── lib/
│   │   ├── palette.ts       # 缩图采样 + K-means 主色聚类 + 参数推导
│   │   ├── skeleton.ts      # 双阈值边缘骨架 + 主体能量框
│   │   ├── align.ts         # 灰度模板匹配（ZNCC）与对齐建议
│   │   ├── transfer.ts      # 色彩统计 + 17³ 3D LUT 仿色
│   │   ├── presets.ts       # 内置滤镜与兜底分析结果
│   │   └── image.ts         # 图片地址解析
│   └── screens/
│       ├── CameraScreen.tsx # 相机、复刻模式、自动对位与仿色流程
│       ├── ExtractScreen.tsx# 参考图提取流程
│       ├── DnaScreen.tsx    # 风格 DNA 编辑
│       ├── LibraryScreen.tsx
│       ├── MyLutsScreen.tsx
│       └── SettingsScreen.tsx
└── assets/samples/          # 示例参考图与示例取景图
```

## 实现说明

### 仿色引擎
不依赖神经卷积训练，整条链路在端侧完成：

1. 缩图采样（`expo-image-manipulator` 缩放 + `jpeg-js` 解码像素）
2. K-means 聚类提取主色板，并由亮度 / 色相分布推导曝光、对比度、色温、饱和度、褪色等参数
3. **取景预览**：`View` + `LinearGradient` 多层叠加近似参考色调，零原生依赖、毫秒级响应
4. **拍摄仿色**：统计参考图与实拍图各通道均值 / 标准差、平均饱和度，构建 17³ 3D LUT（均值-标准差迁移 + 饱和度缩放），对 720px 照片做三线性插值后重新编码

取景阶段是演示级近似，拍摄结果则是真实的逐像素色彩迁移。

### 复刻拍摄
- 参考图加载时一次性生成三层数据：SVG 骨架、96×128 灰度模板、色彩统计
- 自动对位每约 1.5s 抓一帧低清照片，缩放到 96px 宽后与模板做 ZNCC：先粗搜 ±18px（步长 3），再细搜 ±3px（步长 1），并在 0 / ±6 / ±12° 五个角度中取最优
- 匹配值换算成 0–100 相似度与归一化平移量，用指数平滑抑制抖动，再由 `describeAlign` 生成方向箭头和指令文案
- 鬼影手势基于 RN 内置 PanResponder，不引入 gesture-handler / reanimated，Expo Go 可直接运行
- 陀螺仪只用于补充「手机左右倾斜」提示，不再承担对齐计算

## 已知限制

- 演示版拍摄不会写入相册，也不保存照片
- 取景画面的仿色是叠层近似，逐像素 3D LUT 只作用于拍摄结果（720px 端侧处理，生成需 1–2 秒）
- 自动对位依赖定时抓帧（约 1.5s 一次），快速移动手机时提示会略滞后
- 没有 GPU Shader 渲染管线，取景画面无法做到逐像素 LUT
- 提供的是未签名 IPA，需要自行侧载，免费账号签名 7 天过期
- 风格与滤镜仅保存在内存，重启后恢复默认

## 后续方向

- 接入 GPU Shader（如 Skia RuntimeShader）实现取景逐像素 LUT
- 提高抓帧频率或接入相机帧处理器，让平移 / 距离引导更实时
- 支持导入导出 `.cube`，并本地持久化滤镜库
- EAS 构建 iOS / Android 安装包

## License

见 [LICENSE](./LICENSE)。
