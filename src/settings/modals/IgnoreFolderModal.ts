import { App, ButtonComponent, Modal, Setting } from "obsidian";
import { FolderSuggest } from "settings/suggesters/FolderSuggester";

export class IgnoreFolderModal extends Modal {
    private folder = "";

    constructor(
        app: App,
        private onSubmit: (folder: string) => Promise<void> | void,
    ) {
        super(app);
    }

    onOpen() {
        this.setTitle("添加排除规则");
        const { contentEl } = this;

        this.modalEl.addClass("templater-ignore-folder-modal");

        const folderSetting = new Setting(contentEl)
            .setName("文件夹")
            .setDesc("输入路径，例如 meta/templates")
            .addText((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.onChange((value) => {
                    this.folder = value;
                });
            });

        const buttonContainer = contentEl.createDiv("modal-button-container");
        new ButtonComponent(buttonContainer)
            .setButtonText("完成")
            .setCta()
            .onClick(async () => {
                if (!this.folder) {
                    folderSetting.setErrorMessage("文件夹不能为空");
                    return;
                }
                await this.onSubmit(this.folder);
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
