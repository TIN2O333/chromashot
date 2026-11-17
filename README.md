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
- 参考图先被提取成**结构骨架**（灰度 + Sobel 边缘提取 + 梯度方向非极大值抑制），以金色细线叠加在取景画面上，用来对位构图
- 支持「轮廓 / 彩色」两种鬼影模式，彩色模式可调透明度
- 手动对齐后点「锁定构图」，用陀螺仪（DeviceMotion）记录当前姿态
- 锁定后实时给出「向左转 6°」「抬高 3°」等方向提示与对齐百分比；对齐度越高，边缘光越亮、骨架越实、触觉反馈越密
- 快门反馈会说明构图保持情况

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
| 图像处理 | expo-image-manipulator + jpeg-js（端侧像素解码） |
| 渲染 | react-native-svg（骨架与雷达图）、expo-linear-gradient（调色叠层） |
| 交互 | expo-haptics（触觉反馈） |

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
│   │   ├── ReplicaGuide.tsx # 复刻鬼影（骨架 / 彩色）与边缘光
│   │   ├── ReplicaHud.tsx   # 对齐度、方向提示、锁定控件
│   │   └── ...
│   ├── lib/
│   │   ├── palette.ts       # 缩图采样 + K-means 主色聚类 + 参数推导
│   │   ├── skeleton.ts      # 边缘骨架提取
│   │   ├── presets.ts       # 内置滤镜与兜底分析结果
│   │   └── image.ts         # 图片地址解析
│   └── screens/
│       ├── CameraScreen.tsx # 相机、复刻模式、姿态对齐
│       ├── ExtractScreen.tsx# 参考图提取流程
│       ├── DnaScreen.tsx    # 风格 DNA 编辑
│       ├── LibraryScreen.tsx
│       ├── MyLutsScreen.tsx
│       └── SettingsScreen.tsx
└── assets/samples/          # 示例参考图与示例取景图
```

## 实现说明

### 简化仿色引擎
不依赖神经卷积或 3D LUT 训练，整条链路在端侧完成：

1. 缩图采样（`expo-image-manipulator` 缩放 + `jpeg-js` 解码像素）
2. K-means 聚类提取主色板
3. 由亮度分布与色相分布推导曝光、对比度、色温、饱和度、褪色等参数
4. 用 `View` + `LinearGradient` 叠加层做实时预览

优点是零原生依赖、跨端表现一致、毫秒级响应；代价是无法做到逐像素 LUT 级还原，属于演示级近似。

### 复刻拍摄
- 骨架提取在参考图加载时做一次，结果是一条 SVG 路径，渲染开销很低
- 姿态对齐只比较锁定前后的**角度差**，因此能感知转动，感知不到前后距离与左右平移
- 传感器不可用时自动退化为纯视觉对位

## 已知限制

- 演示版拍摄不会写入相册，也不保存照片
- 未接入 3D LUT 渲染管线
- 提供的是未签名 IPA，需要自行侧载，免费账号签名 7 天过期
- 复刻模式不支持「靠近 / 远离」这类位移引导（需要相机实时帧做图像匹配）
- 风格与滤镜仅保存在内存，重启后恢复默认

## 后续方向

- 接入 3D LUT 渲染，提升色彩还原精度
- 用相机帧做低分辨率重合度匹配，支持真实的平移与距离引导
- 本地持久化滤镜库，支持导入导出 `.cube`
- EAS 构建 iOS / Android 安装包

## License

见 [LICENSE](./LICENSE)。
