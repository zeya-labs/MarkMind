# MarkMind — Firefox 与中文支持分支

[English](README.md) · [隐私说明](PRIVACY.md) · [原项目](https://github.com/migsilva89/MarkMind)

<img src="./assets/readme/logo.png" alt="MarkMind 标志" width="96" height="96">

这是 [migsilva89/MarkMind](https://github.com/migsilva89/MarkMind) 的分支，增加 Firefox 构建和中英文界面。原版 MarkMind 及其设计由 [migsilva89](https://github.com/migsilva89) 开发。

## 2.1.0 的主要变化

- 分别生成浏览器扩展：Chromium 使用 Manifest V3 和 Service Worker；Firefox 使用 Manifest V2 与持久化模块后台页，让关闭弹窗后的长时间 AI 请求继续运行。
- 适配 Firefox 的系统书签根目录、只读目录和分隔符，避免将其误当成普通目标文件夹。
- 增加始终可见的语言选择：跟随浏览器、English、简体中文；选择保存在扩展本地。
- 翻译设置、首次使用引导、扫描、审核、去重、整理进度及常见错误。
- AI 按所选语言生成新文件夹名称、说明和整理摘要；保留已有文件夹名、书签标题、网址和 ID。
- 保留 Gemini、OpenAI、Anthropic、OpenRouter，以及 Ollama / LM Studio 等 OpenAI 兼容接口。

## 浏览器支持与安装

| 浏览器 | 构建目录 | 安装方式 |
| --- | --- | --- |
| Firefox 桌面版 140 及以上 | Releases 中的签名 XPI | 从文件安装，重启后保留 |
| Chrome / Chromium / Edge | dist/chromium | 开发者模式，加载已解压扩展 |

Firefox 仍同时支持 Manifest V2 与 Manifest V3。本分支选择持久化后台页，是为了让长时间 AI 请求在关闭弹窗后保持运行。参见 [Mozilla 的扩展平台说明](https://blog.mozilla.org/en/firefox/firefox-manifest-v3-adblockers/)及[后台清单字段文档](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background)。

**发布页提供经过 Mozilla 签名的 Firefox XPI，通过 GitHub 自行分发；此分支尚未在 Mozilla Add-ons（AMO）公开上架。** 原项目的 Chrome 应用商店页面属于上游项目，不包含本分支的修改。

### Firefox：安装签名发布包（推荐）

1. 从 [v2.1.0 发布页](https://github.com/zeya-labs/MarkMind/releases/tag/v2.1.0)下载 [markmind-firefox-2.1.0-signed.xpi](https://github.com/zeya-labs/MarkMind/releases/download/v2.1.0/markmind-firefox-2.1.0-signed.xpi)，不要解压 XPI。
2. 在 Firefox 地址栏打开 about:addons。
3. 点击齿轮菜单，选择“从文件安装附加组件…”。
4. 选择签名 XPI，查看 Firefox 的权限提示并确认安装。
5. 在扩展菜单打开 MarkMind，选择语言和 AI 服务商。

签名版本在重启 Firefox 后仍会保留。通过 Mozilla 签名不等于在 AMO 公开上架。签名只适用于此发布包的原始内容；自行构建或修改代码后，需要重新提交 Mozilla 签名才能永久安装。参见 Mozilla 的[签名说明](https://extensionworkshop.com/documentation/publish/signing-and-distribution-overview/)。

### Firefox：临时加载未签名开发版本

1. 从本分支的发布附件下载 Firefox ZIP，或自行构建。
2. 解压 ZIP，并保留解压目录。
3. 在 Firefox 地址栏打开 about:debugging#/runtime/this-firefox。
4. 点击“临时载入附加组件”，选择解压目录里的 manifest.json。自行构建时选择 dist/firefox/manifest.json。
5. 在扩展菜单打开 MarkMind，选择语言和 AI 服务商。

临时扩展在重启 Firefox 后会卸载，需要重新选择同一个 manifest.json。未签名 ZIP 与本地解压构建仅用于测试和开发；日常使用请安装上面的签名发布包。参见 Mozilla 的[临时安装说明](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)。

### Chrome / Edge：加载构建目录

1. 打开 chrome://extensions 或 edge://extensions。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”，选择 dist/chromium。

## 用 AI 批量整理已有书签

1. 先用浏览器书签管理器导出备份。
2. 打开 MarkMind →“整理”，扫描现有书签。
3. 根据需要检查重复书签。MarkMind 删除重复项后不能撤销，也不提供完整备份功能。
4. 选择要整理的书签，包含散落在目录外的书签。
5. 可选一个目标文件夹，将整理结果限制在该目录及其子目录内。
6. 开始 AI 分析，审核建议的目标目录，仅勾选你认可的移动。
7. 确认应用。

仅分析不会移动书签；应用计划会移动原书签，而不是复制一份。若部分移动失败，之前已完成的移动不会自动回滚。建议先用少量书签检查分类是否符合习惯。

Firefox 分析书签时可以关闭扩展弹窗，稍后重新打开查看进度。任务完成前，请保持 Firefox 运行，并保持扩展启用。退出浏览器或重新加载扩展会中断正在进行的请求；任务不会在浏览器退出后继续执行。

批量分析主要使用标题、网址、当前目录路径和文件夹结构，不会逐个抓取书签网页全文。单页整理还可使用当前页面的描述与主标题。

## 语言设置

无需先配置 AI，首次引导页面也可切换语言。

- **跟随浏览器 / auto**：中文浏览器环境使用简体中文，其他环境使用英文。
- **English / en**、**简体中文 / zh-CN**：手动选择并保存在扩展本地。
- AI 新生成的文件夹名称、说明及摘要使用所选语言。
- 已有文件夹名、书签标题和路径保持原样。
- 外部服务返回的原始错误可能保持其原语言。

## 配置 AI 服务商

选择服务商，填写 API 密钥，加载模型列表，再选择模型。调用费用和免费额度由服务商决定，MarkMind 不附赠付费 AI 额度。

| 服务商 | 获取 API 密钥 |
| --- | --- |
| Google Gemini | [Google AI Studio](https://aistudio.google.com/apikey) |
| OpenAI | [OpenAI Platform](https://platform.openai.com/api-keys) |
| Anthropic | [Anthropic Console](https://console.anthropic.com/) |
| OpenRouter | [OpenRouter](https://openrouter.ai/keys) |
| 自定义 OpenAI 兼容接口 | 由接口决定；本地服务可不填密钥 |

### Ollama 与 LM Studio

在设置中选择“自定义”。Ollama 可填写 http://127.0.0.1:11434/v1，LM Studio 可填写 http://127.0.0.1:1234/v1；本地服务不要求鉴权时，密钥留空。浏览器提示时，允许扩展访问该接口。

如果 Ollama 返回 403，可设置 OLLAMA_ORIGINS 环境变量以允许扩展来源，然后重启 Ollama。跨浏览器开发时可使用：

~~~text
OLLAMA_ORIGINS=chrome-extension://*,moz-extension://*
~~~

如果 LM Studio 拒绝浏览器请求，可在其服务器设置中开启 CORS。远程接口请使用 HTTPS；扩展只允许本机回环地址使用明文 HTTP。本地模型会使用较小批次和更长超时，但速度与分类效果仍取决于模型及硬件。

## 数据与隐私

AI 分析会将所选书签信息及目录上下文直接发送到你配置的服务商；API 密钥也会发送给该服务商完成鉴权。设置、密钥、模型缓存和整理会话保存在浏览器的扩展本地存储中，**该存储不是加密密码保险箱**。

此分支没有分析统计或遥测服务，不需要 MarkMind 账号，也没有中转服务器。AI 服务商的数据政策仍然适用；网页资源与外链访问也可能产生正常网络请求。处理私人链接或机密内容前，请阅读[隐私说明](PRIVACY.md)。

## 构建与验证

使用 Node.js 22 和 npm。从全新目录开始：

~~~bash
git clone https://github.com/zeya-labs/MarkMind.git
cd MarkMind
npm ci
npm run lint
npm test
npm run build
npm run lint:firefox
npm run package:firefox
~~~

产物说明：

- dist/chromium：可加载到 Chrome / Chromium / Edge 的解压扩展。
- dist/firefox：可临时加载到 Firefox 的解压扩展，包含 manifest.json。
- artifacts/markmind-firefox-2.1.0.zip：未签名的 Firefox 包。

签名 XPI 是另行提供的[发布附件](https://github.com/zeya-labs/MarkMind/releases/download/v2.1.0/markmind-firefox-2.1.0-signed.xpi)，不是上述本地构建命令的产物。重新构建或修改源码不会保留发布包的 Mozilla 签名；修改后的包必须重新签名。

npm run dev 用于 Chromium 开发；npm run build:firefox 只重建 Firefox 版本。tools/github-actions-ci.yml 提供自动检查、测试、双浏览器构建、校验和打包的 GitHub Actions 模板。当前发布凭据缺少 workflow 权限，因此模板尚未启用；如需启用，请使用具有工作流权限的凭据将其复制到 .github/workflows/ci.yml。自动打包的产物仍未签名。

### 真实 Firefox 测试

构建完成后运行：

~~~bash
npm run test:firefox
~~~

测试使用无界面的 Firefox、独立临时配置、测试书签和本地模拟 AI 接口，检查中文启动、原生书签扫描、指定目录整理、关闭弹窗后的后台分析、应用前审核、原书签标题保留，以及英文语言偏好持久化。测试不调用真实 AI 服务，也不使用个人 API 密钥。报告及截图保存在 test-results/。

需要可用的 Firefox 和兼容的 geckodriver。无法自动发现时，可设置 FIREFOX_BINARY 和 GECKODRIVER。把 FIREFOX_AI_DELAY_MS 设为 65000，可以测试超过 60 秒的 AI 请求，例如在 PowerShell 中：

~~~powershell
$env:FIREFOX_AI_DELAY_MS = '65000'
npm run test:firefox
Remove-Item Env:FIREFOX_AI_DELAY_MS
~~~

CI 模板不运行此 Selenium 测试，只运行前述可移植的校验与打包步骤。

签名发布包可另行运行 `node tools/verify-firefox-signature.mjs /path/to/addon.xpi` 验证。脚本使用 Firefox 自身校验签名，在新建的独立配置中安装，并检查重启后扩展是否仍然启用；不会使用你的个人浏览器配置。

### 校验与依赖说明

npm run lint:firefox 运行 tools/lint-firefox.mjs，拒绝所有错误及白名单之外的警告。白名单仅限独立 React vendor 文件中的 UNSAFE_VAR_ASSIGNMENT：当前构建有两条来自 React DOM 通用 innerHTML 分支的警告。应用代码的警告不在白名单内。因此，“校验通过”不表示原始 web-ext 报告中完全没有警告。

本版本使用包含安全修复的 Vite 6.4.4。交付时锁文件的生产依赖审计为零漏洞；开发工具依赖仍有中、低等级审计项。可运行 npm audit --omit=dev 与 npm audit 查看当前结果，不应把生产依赖通过理解为全部开发依赖均无问题。

## 致谢与反馈

- 原项目：[migsilva89/MarkMind](https://github.com/migsilva89/MarkMind)。
- 原项目网站：[markmind.xyz](https://markmind.xyz)。
- 支持上游作者：[Buy me a coffee](https://buymeacoffee.com/migsilva?utm_source=github-markmind)。
- 本分支 Firefox 与多语言问题：[提交 Issue](https://github.com/zeya-labs/MarkMind/issues)。

## 许可证

保留上游原始声明：

> This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

本分支未另行创建替代许可证文件。
