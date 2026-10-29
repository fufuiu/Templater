# Templater 简体中文汉化维护与交接

这是用户自用的 Obsidian Templater 简体中文汉化源码仓库。直接修改现有
TypeScript 源码和内置函数说明，不引入 i18n 依赖或多语言框架。
以下状态记录于 2026-10-22；开始工作时先检查实际 Git 状态。

## 当前状态

- 本地维护分支：`zh-cn`，已创建并切换；保留原有 `master` 分支。
- 2026-10-29 已接入公开 Fork：`origin` → `https://github.com/fufuiu/Templater.git`，
  GitHub 默认分支及本地维护分支均为 `zh-cn`。
- 官方远程：`upstream` → `https://github.com/SilentVoid13/Templater.git`。
  从 `upstream` 获取正式发布版本，只向 `origin` 推送汉化修改。
- 当前插件版本为 `2.26.0`。2026-10-22 已将官方 `2.26.0` 标签（`28c1ff7`）
  合并进 `zh-cn`。该发布相对旧基线 `c51cf11`（2.25.1+12，功能提交已包含
  在旧基线中）只改了 CHANGELOG/manifest/package/versions 版本文件，
  无新增界面文案需要补译。
- 汉化已保存为独立提交 `a71f79a`，同步合并提交为 `6bd046c`。`zh-cn`
  分支历史完整，不再是未提交状态。
- 已汉化：设置页及说明、命令名称、侧栏图标提示、文件菜单、弹窗及按钮、
  安全确认、校验提示、错误及迁移通知、内置函数的自动补全说明和 README。
- 保留模板语法、函数名、命令 ID、配置键、枚举值、正则表达式及协议格式。
  内置代码示例、用户模板内容、用户脚本说明和原有文件名不自动翻译。
- 2026-10-22 验证：`npm run typecheck`、`npm run lint`、`npm run build`
  通过（Lint 仍为 4 条警告；构建仍有旧版 esbuild 警告；构建脚本通过
  Obsidian CLI 成功重载插件）。manifest 冲突按“新版本号 + 中文描述”解决。
- **WebdriverIO 界面自动化测试仍未运行，不能记为通过。** 真实 Obsidian
  界面由用户试用验收。

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
2. 用户要求更新时，执行 `git fetch upstream --tags`。指定版本时使用指定
   标签；未指定时优先选择正式发布版本，只有用户需要开发版时才合并
   `upstream/master`。检查实际标签和提交关系，不在本文固定下一版本号。
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

- 用户仓库（2026-10-22 实测，已由 `Personal OSV2` 改名）：
  `/home/nldff/文档/obsidian/Personal OS`。
- 插件目录：该仓库的 `.obsidian/plugins/obsidian-Templater/`
  （注意目录名与插件 ID `templater-obsidian` 不同）。
- 2026-10-22 已安装 2.26.0 汉化构建并逐文件校验 `main.js`、
  `manifest.json`、`styles.css`；覆盖前旧文件已备份到
  `.obsidian/plugin-backups/obsidian-Templater-<时间戳>/`。
  未改动 `data.json` 与设备本地设置。
- 当前安装包：项目根目录的 `Templater-2.26.0-zh-CN.zip`
  （旧 `Templater-2.25.1-zh-CN.zip` 可删）。
  插件最低 Obsidian 版本为 `1.13.0`；同步上游时以新版 manifest 为准。
- 用户要求将后续构建安装到该仓库时，仅复制三个发布文件；覆盖前把已有
  同名文件备份到该仓库的 `.obsidian/plugin-backups/obsidian-Templater-时间戳/`。
  保留 `data.json`、设备本地设置、其他插件配置和笔记，不替换整个插件目录。
- 复制后校验文件内容，并提示重新加载插件或重启 Obsidian。
  在 Obsidian 内更新官方插件会覆盖本地汉化；后续维护应从 `zh-cn` 源码构建。
