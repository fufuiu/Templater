# Templater 简体中文汉化维护与交接

这是用户自用的 Obsidian Templater 简体中文汉化源码仓库。直接修改现有
TypeScript 源码和内置函数说明，不引入 i18n 依赖或多语言框架。
以下状态记录于 2026-10-07；开始工作时先检查实际 Git 状态。

## 当前状态

- 本地维护分支：`zh-cn`，已创建并切换；保留原有 `master` 分支。
- 官方远程：`origin` → `https://github.com/SilentVoid13/Templater.git`。
  这是官方仓库，不是用户的 fork；不要向它推送汉化修改。
- 当前插件版本为 `2.25.1`，汉化使用的官方基线提交为
  `c51cf118fd8ad0c451dc75bc602955b8f5667145`。该提交位于官方 `master`，
  比 `2.25.1` 发布标签多 12 个提交，不要将两者当作同一个基线。
- **汉化源码、对应测试和本交接文档目前尚未提交。** `zh-cn` 的 HEAD
  仍是上述官方基线。创建分支不等于已将汉化保存到提交历史中。
- 已汉化：设置页及说明、命令名称、侧栏图标提示、文件菜单、弹窗及按钮、
  安全确认、校验提示、错误及迁移通知、内置函数的自动补全说明和 README。
- 保留模板语法、函数名、命令 ID、配置键、枚举值、正则表达式及协议格式。
  内置代码示例、用户模板内容、用户脚本说明和原有文件名不自动翻译。
- 上次验证：`npm run typecheck`、`npm run lint`、`npm run build` 通过。
  Lint 有 4 条警告；构建有旧版 esbuild 不识别 ES2022 的警告。
  本地模拟检查通过 47 个中文设置名称/选项和 6 个命令名称，命令 ID 一致；
  内置说明的函数名、签名和可执行示例保持一致。
- **WebdriverIO 界面自动化测试未完成，不能记为通过。** 上次运行在下载及
  准备测试依赖阶段未产生测试结果；真实 Obsidian 界面由用户试用验收。

## 汉化维护位置与约束

- `src/settings/Settings.ts`：设置定义、说明、选项、列表和安全提示。
  `src/settings/modals/`：设置弹窗、确认按钮和校验错误。
- `src/handlers/CommandHandler.ts`：静态及按模板生成的命令名称，以及 CLI
  帮助文字。保持命令 ID、参数名、返回文件路径和 `Error:` 协议前缀不变。
- `src/settings/TemplateHotkeys.ts`：设置列表中的命令摘要；只翻译显示值，
  不改变持久化格式和快捷键注册逻辑。
- `src/main.ts`、`src/settings/migrate-settings.ts`：设置迁移通知及涉及的
  设置名称。变更时同步检查 `test/specs/migration.e2e.ts` 的文字断言。
- `src/core/functions/internal_functions/system/`：输入和选择弹窗。用户传入
  的标题、占位文本和选项保持原样；保留取消时返回值及抛错行为。
- `src/utils/Log.ts` 和各调用处：通知与错误文字。不要对用户内容或外部
  错误整体做字符串替换，也不要因汉化削弱错误处理。
- `docs/documentation.toml`：自动补全界面使用的内置函数说明和参数解释。
  只翻译 `description`，保留表路径、`name`、`definition`、`example`。
  `src/editor/Autocomplete.ts` 提供参数列表和返回值的中文标签。
- `test/page-objects/` 和 `test/specs/`：部分测试通过可见文字定位控件，
  或断言错误通知。更新文案时一并更新对应定位和断言。
  `test/specs/autocomplete.e2e.ts` 还检查中文说明和函数名补全。
- 不翻译机器使用的字符串，不改变占位符及插值表达式，不更改默认文件名，
  不对所有字符串或生成的 HTML 做全局替换。
- 保留桌面和移动端行为、现有模板和配置兼容性。系统命令、启动模板和
  新文件触发的设备本地设置及风险确认必须保留，不能为安装试用自动开启。

## 后续同步官方更新

1. 查看 `git status --short --branch`、`git branch -avv` 和 `git remote -v`。
   在 `zh-cn` 上维护。首次同步前将当前汉化保存为独立提交；如混有用户
   后续修改，先区分并保留。不要用 `reset --hard` 或整文件覆盖丢弃汉化。
2. 用户要求更新时，执行 `git fetch origin --tags`。指定版本时使用指定
   标签；未指定时优先选择正式发布版本，只有用户需要开发版时才合并
   `origin/master`。检查实际标签和提交关系，不在本文固定下一版本号。
3. 在 `zh-cn` 上通过 `git merge` 合并选定的官方标签或提交，保留官方历史。
   冲突处以新版功能逻辑为准，逐处保留或重译显示文字；不要统一使用
   `ours` 或 `theirs` 处理全部冲突。
4. 检查上游新增及改写的用户可见文字并补译，尤其是设置、动态命令、
   弹窗、错误、迁移通知和 `docs/documentation.toml`。同步相关文字断言，
   检查模板语法、命令 ID、配置兼容性和桌面/移动端行为。
5. 依赖变化时使用 `pnpm install --frozen-lockfile` 安装更新后的锁定依赖。
   依赖版本确需修改时同步维护 `pnpm-lock.yaml`，不要顺带升级无关依赖。
   新版 pnpm 的锁定 Git 依赖构建许可问题见 README；不要把一次性安装
   授权产生的配置变化误当成汉化改动。
6. 运行 `npm run typecheck`、`npm run lint`、`npm run build`。界面测试使用
   `npm test`，至少覆盖设置、迁移、系统弹窗和自动补全；需要下载并启动
   隔离的 Obsidian 实例。没有实际测试结果时如实记录，不能仅凭退出码
   将界面测试记为通过。实际使用界面尚未验收时也应注明。
7. 构建会生成根目录 `main.js`，并复制发布文件到 `test/vault`。
   构建脚本还尝试通过 Obsidian CLI 重载插件；CLI 不可用时的重载报错
   不等于编译失败。安装到个人仓库是单独步骤，不能把测试仓库当成部署目标。
8. 更新本文中的官方版本/基线、验证结果、提交状态和安装状态，提交完成的
   合并及汉化修改。`main.js` 和汉化 ZIP 是可重建产物，不作为维护源码提交。

## 本地试用安装

- 用户指定仓库：`/home/nldff/文档/obsidian/Personal OSV2`。
- 插件目录：该仓库的 `.obsidian/plugins/templater-obsidian/`。
- 已复制并逐文件校验 `main.js`、`manifest.json`、`styles.css`。
  插件 ID 已加入该仓库 `.obsidian/community-plugins.json` 的启用列表，
  原列表备份为 `.obsidian/community-plugins.json.before-templater`。
  未自动开启模板执行的高风险设置。
- 当前安装包：项目根目录的 `Templater-2.25.1-zh-CN.zip`。
  插件最低 Obsidian 版本为 `1.13.0`；同步上游时以新版 manifest 为准。
- 用户要求将后续构建安装到该仓库时，仅复制三个发布文件；覆盖前把已有
  同名文件备份到该仓库的 `.obsidian/plugin-backups/templater-obsidian-时间戳/`。
  保留 `data.json`、设备本地设置、其他插件配置和笔记，不替换整个插件目录。
- 复制后校验文件内容，并提示重新加载插件或重启 Obsidian。
  在 Obsidian 内更新官方插件会覆盖本地汉化；后续维护应从 `zh-cn` 源码构建。
