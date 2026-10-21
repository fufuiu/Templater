import TemplaterPlugin from "main";
import {
    normalizePath,
    Setting,
    SettingGroup,
    SettingPage,
    TFile,
} from "obsidian";
import { TemplaterSettingTab } from "settings/Settings";
import { errorWrapperSync } from "utils/Error";
import { get_tfiles_from_folder } from "utils/Utils";

export class UserScriptsPage extends SettingPage {
    pluginSettingTab: TemplaterSettingTab;
    plugin: TemplaterPlugin;
    userScripts: TFile[] = [];

    constructor(
        pluginSettingTab: TemplaterSettingTab,
        plugin: TemplaterPlugin,
    ) {
        super();
        this.pluginSettingTab = pluginSettingTab;
        this.plugin = plugin;
    }

    loadUserScripts() {
        const files = errorWrapperSync(
            () =>
                get_tfiles_from_folder(
                    this.plugin.app,
                    this.plugin.settings.user_scripts_folder,
                ),
            `用户脚本文件夹不存在`,
        );
        this.userScripts = Array.isArray(files)
            ? files.filter((file) => file.extension === "js")
            : [];
    }

    openUserScriptsFolderInDefaultApp() {
        const path = this.plugin.settings.user_scripts_folder;
        if (path) {
            this.plugin.app.openWithDefaultApp(normalizePath(path));
        }
    }

    display(): void {
        this.containerEl.empty();
        this.loadUserScripts();

        if (this.plugin.settings.user_scripts_folder) {
            new Setting(this.containerEl)
                .setHeading()
                .addExtraButton((cb) => {
                    cb.setIcon("folder")
                        .setTooltip("打开用户脚本文件夹")
                        .onClick(() =>
                            this.openUserScriptsFolderInDefaultApp(),
                        );
                });
        }

        if (this.userScripts.length === 0) {
            new Setting(this.containerEl)
                .setName(
                    (() => {
                        const desc = createFragment();
                        if (!this.plugin.settings.user_scripts_folder) {
                            desc.append(
                                "尚未设置用户脚本文件夹，请返回上一页设置。",
                                desc.createEl("br"),
                                desc.createEl("br"),
                            );
                        }
                        desc.append(
                            "用户脚本是作为 CommonJS 模块加载的 JavaScript 文件。你可以在模板中使用以下语法调用这些函数：",
                            desc.createEl("code", {
                                text: "<% tp.user.file_name() %>",
                            }),
                        );
                        return desc;
                    })(),
                )
                .setClass("mod-empty-state");
            return;
        }

        const group = new SettingGroup(this.containerEl).addClass("mod-list");

        this.userScripts.forEach((script) => {
            group.addSetting((setting) => {
                setting.setName(`tp.user.${script.basename}`);
            });
        });
    }
}
