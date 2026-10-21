import { App, Modal, Setting } from "obsidian";

export class SystemCommandModal extends Modal {
    private name: string;
    private command: string;

    constructor(
        app: App,
        initialValues: { name: string; command: string },
        private onSubmit: (
            name: string,
            command: string,
        ) => Promise<void> | void,
        private validateName: (name: string) => string | undefined,
    ) {
        super(app);
        this.name = initialValues.name;
        this.command = initialValues.command;
    }

    onOpen() {
        this.setTitle("用户函数");
        this.modalEl.addClass("templater-system-command-modal");
        const { contentEl } = this;

        const functionNameSetting = new Setting(contentEl)
            .setName("函数名")
            .addText((cb) => {
                cb.setPlaceholder("函数名")
                    .setValue(this.name)
                    .onChange((value) => {
                        this.name = value;
                    });
            });

        new Setting(contentEl).setName("系统命令").addTextArea((cb) => {
            cb.setPlaceholder("系统命令")
                .setValue(this.command)
                .onChange((value) => {
                    this.command = value;
                });
            cb.inputEl.setAttr("rows", 4);
        });

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("完成")
                    .setCta()
                    .onClick(async () => {
                        const error = !this.name
                            ? "函数名不能为空"
                            : this.validateName(this.name);
                        if (error) {
                            functionNameSetting.setErrorMessage(error);
                            return;
                        }
                        await this.onSubmit(this.name, this.command);
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
