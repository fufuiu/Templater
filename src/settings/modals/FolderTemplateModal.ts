import { App, Modal, Setting } from "obsidian";
import TemplaterPlugin from "main";
import { FolderSuggest } from "settings/suggesters/FolderSuggester";
import {
    FileSuggest,
    FileSuggestMode,
} from "settings/suggesters/FileSuggester";

export class FolderTemplateModal extends Modal {
    private folder: string;
    private template: string;

    constructor(
        app: App,
        private plugin: TemplaterPlugin,
        initialValues: { folder: string; template: string },
        private onSubmit: (
            folder: string,
            template: string,
        ) => Promise<void> | void,
        private validateFolder: (folder: string) => string | undefined,
    ) {
        super(app);
        this.folder = initialValues.folder;
        this.template = initialValues.template;
    }

    onOpen() {
        this.setTitle("文件夹模板");
        this.modalEl.addClass("templater-folder-template-modal");
        const { contentEl } = this;

        const folderSetting = new Setting(contentEl)
            .setName("文件夹")
            .setDesc("需要匹配的文件夹，包括其子文件夹。")
            .addText((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder("文件夹")
                    .setValue(this.folder)
                    .onChange((value) => {
                        this.folder = value;
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
                        if (!this.folder) {
                            folderSetting.setErrorMessage(
                                "文件夹不能为空",
                            );
                            return;
                        }
                        if (!this.template) {
                            templateSetting.setErrorMessage(
                                "模板不能为空",
                            );
                            return;
                        }
                        const error = this.validateFolder(this.folder);
                        if (error) {
                            folderSetting.setErrorMessage(error);
                            return;
                        }
                        await this.onSubmit(this.folder, this.template);
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
