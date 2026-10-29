# Obsidian Templater 简体中文版

![Templater 标志](./imgs/templater_logo.svg)

[Templater](https://github.com/SilentVoid13/Templater) 是 [Obsidian](https://obsidian.md/) 的高级模板插件，可在笔记中插入变量、函数结果，并执行 JavaScript 代码，实现自动化。

本版本基于 Templater 2.26.0，将插件设置页、命令、弹窗、提示及内置函数的自动补全说明翻译为简体中文。界面固定使用简体中文；模板语法、函数名、命令 ID 和配置键名保持兼容。原有在线文档及代码示例保留原文；用户自己编写的脚本说明和模板内容不自动翻译。

这是个人自用的汉化 Fork，在 `zh-cn` 分支维护。上游更新通过 `upstream` 获取，个人修改推送到 `origin`；维护记录见 [AGENTS.md](AGENTS.md)。

## 安装汉化版

需要 Obsidian 1.13.0 或更高版本。

1. 关闭 Templater 插件。
2. 将安装包中的 `templater-obsidian` 文件夹放入仓库的 `.obsidian/plugins/` 目录。已安装原版时，只替换 `main.js`、`manifest.json` 和 `styles.css`，保留原有的 `data.json`。
3. 在 Obsidian 的“设置 → 第三方插件”中启用 Templater。若界面尚未刷新，重启 Obsidian。

原版自动更新会覆盖汉化文件，更新后需重新安装对应版本的汉化包。

## 从源码构建

```bash
pnpm install --frozen-lockfile
npm run typecheck
npm run lint
npm run build
```

构建后，将项目根目录的 `main.js`、`manifest.json` 和 `styles.css` 复制到仓库的 `.obsidian/plugins/templater-obsidian/` 目录。

使用新版 pnpm 时，如果提示锁定的 Git 依赖未获准构建，可运行：

```bash
pnpm install --frozen-lockfile \
  --allow-build '@codemirror/language@https://codeload.github.com/lishid/cm-language/tar.gz/cc6a2cc30288db6be3f879ddf0e3ef64f14ed6ab' \
  --allow-build esbuild \
  --allow-build '!classic-level' \
  --allow-build '!edgedriver' \
  --allow-build '!geckodriver'
```

## 使用文档

查看[完整官方文档（英文）](https://silentvoid13.github.io/Templater/)了解模板语法和函数用法。内置函数的说明和参数解释可在插件的自动补全界面中查看中文翻译。

例如，在模板中插入当前日期：

```javascript
<% tp.date.now("YYYY-MM-DD") %>
```

## 安全提示

Templater 可以执行任意 JavaScript 代码和系统命令。执行来源不可信的代码或命令可能带来风险，请只运行你了解且来源可信的内容。

创建文件时自动执行模板、启动模板及系统命令等设置仅保存在当前设备上，需要在每台设备上分别确认并启用。

## 模板分享与帮助

可在上游仓库的[讨论区](https://github.com/SilentVoid13/Templater/discussions)提问、交流想法，或在[模板展示区](https://github.com/SilentVoid13/Templater/discussions/categories/templates-showcase)分享模板。模板文件也可通过 [Gist](https://gist.github.com/) 分享。

相关资源：

- [GitMurf：配置并运行第一个 Templater JavaScript 脚本](https://github.com/SilentVoid13/Templater/discussions/187)
- [chhoumann 的模板示例](https://github.com/chhoumann/Templater_Templates)
- [Zachatoo 的模板片段](https://zachyoung.dev/posts/templater-snippets)
- [lguenth 的 Obsidian 模板](https://github.com/lguenth/obsidian-templates)
- [tallguyjenks 的视频介绍](https://youtu.be/2234DXKbNgM?t=1944)
- [ProductivityGuru 的视频介绍](https://www.youtube.com/watch?v=cSawi0tYPMM)

其他模板插件：[QuickAdd](https://github.com/chhoumann/quickadd)、[Obsidian Temple](https://github.com/garyng/obsidian-temple)、[MetaTemplates](https://github.com/avirut/obsidian-metatemplates)。

## 贡献与许可证

提交问题、功能建议或代码修改前，请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

Templater 由 SilentVoid13 创建，Zachatoo 维护，采用 GNU AGPLv3 许可证。汉化版保留原作者署名及许可证，详见 [LICENSE.TXT](LICENSE.TXT)。

## 支持原作者与维护者

可通过 [GitHub Sponsors](https://github.com/sponsors/Zachatoo) 或 [Ko-fi](https://ko-fi.com/zachatoo) 支持维护者 Zachatoo；通过 [GitHub Sponsors](https://github.com/sponsors/SilentVoid13) 或 [PayPal](https://www.paypal.com/donate?hosted_button_id=U2SRGAFYXT32Q) 支持创作者 SilentVoid13。
