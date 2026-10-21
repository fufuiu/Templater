import { App, ButtonComponent, Modal, Setting } from "obsidian";
import TemplaterPlugin from "main";
import {
    FileSuggest,
    FileSuggestMode,
} from "settings/suggesters/FileSuggester";

export class StartupTemplateModal extends Modal {
    private template = "";

    constructor(
        app: App,
        private plugin: TemplaterPlugin,
        private onSubmit: (template: string) => Promise<void> | void,
    ) {
        super(app);
    }

    onOpen() {
        this.setTitle("添加启动模板");
        const { contentEl } = this;

        this.modalEl.addClass("templater-startup-template-modal");

        const templateSetting = new Setting(contentEl)
            .setName("模板")
            .setDesc("输入模板路径，例如 meta/templates/daily.md")
            .addText((cb) => {
                new FileSuggest(
                    cb.inputEl,
                    this.plugin,
                    FileSuggestMode.TemplateFiles,
                );
                cb.onChange((value) => {
                    this.template = value;
                });
            });

        const buttonContainer = contentEl.createDiv("modal-button-container");
        new ButtonComponent(buttonContainer)
            .setButtonText("完成")
            .setCta()
            .onClick(async () => {
                if (!this.template) {
                    templateSetting.setErrorMessage(
                        "模板不能为空",
                    );
                    return;
                }
                await this.onSubmit(this.template);
                this.close();
            });
        new ButtonComponent(buttonContainer)
            .setButtonText("取消")
            .onClick(() => this.close());
    }

    onClose() {
        this.contentEl.empty();
    }
}
