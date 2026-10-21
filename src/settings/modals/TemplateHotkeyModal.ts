import { App, Modal, Setting } from "obsidian";
import TemplaterPlugin from "main";
import {
    FileSuggest,
    FileSuggestMode,
} from "settings/suggesters/FileSuggester";
import type { ResolvedTemplateHotkey } from "settings/TemplateHotkeys";

export class TemplateHotkeyModal extends Modal {
    private template: string;
    private insert_enabled: boolean;
    private create_enabled: boolean;

    constructor(
        app: App,
        private plugin: TemplaterPlugin,
        initialValues: ResolvedTemplateHotkey,
        private onSubmit: (
            hotkey: ResolvedTemplateHotkey,
        ) => Promise<void> | void,
        private validateTemplate: (template: string) => string | undefined,
    ) {
        super(app);
        this.template = initialValues.template;
        this.insert_enabled = initialValues.insert_enabled;
        this.create_enabled = initialValues.create_enabled;
    }

    onOpen() {
        this.setTitle("模板快捷键");
        this.modalEl.addClass("templater-template-hotkey-modal");
        const { contentEl } = this;

        const templateSetting = new Setting(contentEl)
            .setName("模板")
            .setDesc("输入模板路径，例如 meta/templates/daily.md")
            .addText((cb) => {
                new FileSuggest(
                    cb.inputEl,
                    this.plugin,
                    FileSuggestMode.TemplateFiles,
                );
                cb.setPlaceholder("模板")
                    .setValue(this.template)
                    .onChange((value) => {
                        this.template = value;
                    });
            });

        const insertSetting = new Setting(contentEl)
            .setName("插入命令")
            .setDesc(
                "添加一个将此模板插入当前文件的命令。",
            )
            .addToggle((cb) => {
                cb.setValue(this.insert_enabled).onChange((value) => {
                    this.insert_enabled = value;
                });
            });

        new Setting(contentEl)
            .setName("创建命令")
            .setDesc(
                "添加一个使用此模板创建新笔记的命令。",
            )
            .addToggle((cb) => {
                cb.setValue(this.create_enabled).onChange((value) => {
                    this.create_enabled = value;
                });
            });

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("完成")
                    .setCta()
                    .onClick(async () => {
                        if (!this.template) {
                            templateSetting.setErrorMessage(
                                "模板不能为空",
                            );
                            return;
                        }
                        const error = this.validateTemplate(this.template);
                        if (error) {
                            templateSetting.setErrorMessage(error);
                            return;
                        }
                        if (!this.insert_enabled && !this.create_enabled) {
                            insertSetting.setErrorMessage(
                                "至少需要启用一个命令",
                            );
                            return;
                        }
                        await this.onSubmit({
                            template: this.template,
                            insert_enabled: this.insert_enabled,
                            create_enabled: this.create_enabled,
                        });
                        this.close();
                    }),
            )
            .addButton((btn) =>
                btn.setButtonText("取消").onClick(() => this.close()),
            );
    }

    onClose() {
        this.contentEl.empty();
    }
}
