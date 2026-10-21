import { App, Modal, Setting } from "obsidian";
import TemplaterPlugin from "main";
import {
    FileSuggest,
    FileSuggestMode,
} from "settings/suggesters/FileSuggester";

export class FileRegexTemplateModal extends Modal {
    private regex: string;
    private template: string;

    constructor(
        app: App,
        private plugin: TemplaterPlugin,
        initialValues: { regex: string; template: string },
        private onSubmit: (
            regex: string,
            template: string,
        ) => Promise<void> | void,
    ) {
        super(app);
        this.regex = initialValues.regex;
        this.template = initialValues.template;
    }

    onOpen() {
        this.setTitle("文件正则模板");
        this.modalEl.addClass("templater-file-regex-template-modal");
        const { contentEl } = this;

        const regexSetting = new Setting(contentEl)
            .setName("文件正则表达式")
            .setDesc(
                "用于匹配文件的正则表达式。匹配对象是相对于仓库根目录的完整文件路径，包括扩展名。",
            )
            .addText((cb) => {
                cb.setPlaceholder("文件正则表达式")
                    .setValue(this.regex)
                    .onChange((value) => {
                        this.regex = value;
                    });
            });

        const templateSetting = new Setting(contentEl)
            .setName("模板")
            .setDesc("匹配成功时应用的模板。")
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

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("完成")
                    .setCta()
                    .onClick(async () => {
                        if (!this.regex) {
                            regexSetting.setErrorMessage(
                                "文件正则表达式不能为空",
                            );
                            return;
                        }
                        if (!this.template) {
                            templateSetting.setErrorMessage(
                                "模板不能为空",
                            );
                            return;
                        }
                        await this.onSubmit(this.regex, this.template);
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
