import { App, ConfirmationButton, ConfirmationModal, Platform } from "obsidian";

export class ConfirmDangerousSettingModal extends ConfirmationModal {
    constructor(
        app: App,
        title: string,
        warningText: string,
        onConfirm: () => Promise<void> | void,
    ) {
        super(app);
        this.setTitle(title);
        this.modalEl.addClass("templater-confirm-dangerous-setting-modal");
        this.contentEl.createEl("p", { text: warningText });
        this.contentEl.createEl("p", {
            text: "只有在你信任此仓库当前及今后的内容时才应启用，包括今后从他人处下载、复制或同步的文件。",
            cls: "mod-warning",
        });
        this.contentEl.createEl("p", {
            text: "此设置仅保存在当前设备上；请在使用此仓库的每台设备上分别启用。",
        });

        let enableBtn!: ConfirmationButton;
        if (Platform.isMobile) {
            this.addButton((btn) => {
                enableBtn = btn;
                btn.setButtonText("我已了解风险，启用")
                    .setCta()
                    .onClick(async () => {
                        await onConfirm();
                    });
            });
        } else {
            this.addCheckbox("我已了解风险", (checked) => {
                enableBtn.setDisabled(!checked);
            }).addButton((btn) => {
                enableBtn = btn;
                btn.setButtonText("启用")
                    .setCta()
                    .setDisabled(true)
                    .onClick(async () => {
                        await onConfirm();
                    });
            });
        }

        this.addCancelButton("取消");
    }
}
