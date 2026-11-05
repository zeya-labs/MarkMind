# Privacy / 隐私说明

This document describes the Firefox / Chinese language fork at [zeya-labs/MarkMind](https://github.com/zeya-labs/MarkMind), version 2.1.0.

## English

### Local bookmark operations

MarkMind reads the browser's bookmark tree to display folders, scan bookmarks, identify duplicate URLs, and prepare organization suggestions. Approved actions can create folders, move bookmarks, add the current page, or delete duplicate bookmarks. Deleting and moving bookmarks changes the browser's real bookmarks. Your browser's own account synchronization can propagate those changes to its other devices.

Scanning and reviewing the local bookmark tree do not by themselves send the entire bookmark library to an AI service. Starting AI analysis sends the information described below to the chosen provider.

### What AI requests contain

- **Bulk organization:** selected bookmark IDs, titles, URLs, current folder paths, and folder-tree context. Later batches can include folder suggestions from earlier batches. If a destination is selected, the supplied destination tree is limited to that subtree; selected bookmarks still include their current paths.
- **Single-page organization:** the current page title and URL, available page description and main heading, and bookmark-folder context.
- The page metadata reader also reads a keywords meta tag and favicon URL when available. The current single-page AI request uses description and heading, and does not include the keywords field or favicon image.
- The configured model, instructions, selected output language, and optional provider request settings accompany those requests.
- The API key, if required, is sent directly to the selected provider for authentication. Validation and model-list requests also contact that provider.

MarkMind does not send requests through a server run by this fork. Cloud providers process the data under their own policies, including any retention, review, or model-training terms. URLs can contain private paths or access tokens: review your selected bookmarks before sending them. A local Ollama / LM Studio endpoint keeps inference at the endpoint you configure; a custom remote endpoint is still a third party.

### What is stored locally

Browser extension-local storage holds provider keys and base URLs, selected provider/model, cached model lists, language and theme preferences, onboarding state, and saved organize sessions. Saved sessions can include selected bookmark details, folder context, proposed moves, and progress.

Extension-local storage is not an encrypted password vault. People or software with access to your browser profile or its backups may be able to read it. Uninstalling the extension normally removes its own storage, but browser profile backups and provider-side copies are outside its control. Removing a saved key does not revoke that key at the provider.

### Other network requests and diagnostics

- This fork does not add an analytics, telemetry, or bookmark-collection backend.
- Opening provider help, GitHub, the upstream website, or Discover links navigates to those websites only when you choose the link. Those sites have their own privacy policies.
- Website resources, including icons or images displayed by the browser, can make requests to their source origins. The current page metadata reader obtains an available favicon URL; that is separate from uploading a favicon to an AI service.
- Provider and network errors can be written to the local extension developer console for troubleshooting. Do not share console output without checking it for sensitive information.

### Permissions and choice

Bookmark access enables reading and applying bookmark changes. Active-tab and scripting access allow the current-page metadata reader. Local storage persists settings and sessions. Background alarms support a running organization job. Custom provider endpoints request host access for the endpoint you enter.

The Firefox manifest declares the corresponding data categories, including bookmarks, website content, browsing activity, and authentication information. This declaration is not a promise that every category is sent in every request; the request types above explain the actual behavior.

You choose when to start analysis and which changes to apply. No full backup or transaction rollback is included. Use the browser's bookmark export before large changes. Questions and corrections can be reported in this fork's [issue tracker](https://github.com/zeya-labs/MarkMind/issues).

## 简体中文

### 本地书签操作

MarkMind 读取浏览器书签树，用于显示目录、扫描书签、识别重复网址和准备整理建议。确认应用后，可以创建目录、移动书签、收藏当前页面或删除重复项。这些操作会修改浏览器的真实书签；浏览器自己的账号同步可能把变化同步到其他设备。

仅扫描和查看本地书签树，不会自动将全部收藏发送到 AI 服务。开始 AI 分析时，会发送以下信息。

### AI 请求包含什么

- **批量整理**：所选书签的 ID、标题、网址、当前目录路径及目录结构上下文。后续批次还可能携带先前批次建议的目录。选定目标目录时，提供给 AI 的目标目录树限于该子树，但所选书签仍包含原目录路径。
- **单页整理**：当前页面标题、网址、可取得的页面描述和主标题，以及书签目录上下文。
- 页面元信息读取器还会读取可用的 keywords 标签和图标网址；当前单页 AI 请求使用描述及主标题，不包含 keywords 字段或图标图片。
- 请求还包含模型、提示指令、所选输出语言及部分服务商参数。
- 如服务商要求鉴权，API 密钥会直接发送给该服务商。验证密钥和加载模型列表也会访问所选服务商。

请求不经过本分支运营的中转服务器。云端服务商会按各自政策处理数据，可能涉及保存、人工审核或模型改进。网址可能包含私人路径或访问令牌，请先检查所选书签。Ollama / LM Studio 会在你配置的端点处理数据；自定义远程端点仍属于外部服务。

### 本地保存什么

扩展本地存储保存服务商密钥和接口地址、所选服务商与模型、模型缓存、语言和主题、首次引导状态及整理会话。会话可能包含所选书签详情、目录上下文、建议的移动和进度。

扩展本地存储不是加密密码保险箱。能访问浏览器配置目录或其备份的人和软件，可能读取其中内容。卸载扩展通常会移除其自身存储，但浏览器备份及服务商已接收的数据不受扩展控制。移除本地保存的密钥，不等于在服务商处撤销该密钥。

### 其他网络请求与诊断

- 本分支未增加分析统计、遥测或书签收集后台。
- 服务商帮助、GitHub、上游网站和“发现”中的链接，只在你主动点击时打开；目标网站适用各自隐私政策。
- 浏览器显示的网页资源（包括图标、图片）可能向资源原站发出请求。读取当前页的图标网址与向 AI 上传图标是两回事。
- 服务商及网络错误可能写入扩展的本地开发者控制台。分享日志前，请检查是否包含敏感信息。

### 权限与选择

书签权限用于读取和修改书签；当前标签页及脚本权限用于提取当前页面元信息；本地存储保存设置和会话；后台闹钟支持运行中的整理任务。自定义接口会请求访问你填写的地址。

Firefox 清单声明了书签、网页内容、浏览活动和鉴权信息等数据类别。这不表示每个请求都会发送所有类别；实际传输内容以上方说明为准。

由你决定何时开始分析，以及应用哪些移动。本扩展不提供完整备份或事务回滚。大规模修改前，请使用浏览器书签导出功能。问题与更正可提交到本分支的 [Issue](https://github.com/zeya-labs/MarkMind/issues)。
