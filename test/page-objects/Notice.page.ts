class Notice {
    get #noticeEl() {
        return browser.$(".notice-container .notice");
    }

    async expectNoticeElWithText(text: string) {
        await expect(this.#noticeEl).toHaveText(text);
    }

    async expectTemplateParsingErrorNotice() {
        await this.expectNoticeElWithText(
            "Templater 错误:\n" +
                "模板解析出错，操作已终止。\n" +
                "请查看控制台了解详细信息",
        );
    }

    async expectInvalidReferenceDateFormatErrorNotice() {
        await this.expectNoticeElWithText(
            "Templater 错误:\n" +
                "参考日期格式无效，请尝试使用 reference_format 参数指定格式",
        );
    }

    async expectInclusionDepthLimitErrorNotice() {
        await this.expectNoticeElWithText(
            "Templater 错误:\n" + "已达到文件引用的最大嵌套深度（10 层）",
        );
    }
    async expectUserScriptsFolderNotFoundErrorNotice(folderName: string) {
        await this.expectNoticeElWithText(
            `Templater 错误:\n文件夹“${folderName}”不存在`,
        );
    }

    async expectFileNameCannotIncludeCharsErrorNotice() {
        await this.expectNoticeElWithText(
            "Templater 错误:\n" +
                "文件名不能包含以下字符：\\ / :",
        );
    }

    async expectCancelledPromptErrorNotice() {
        await this.expectNoticeElWithText("Templater 错误:\n已取消输入");
    }

    async expectFailedToLoadUserScriptErrorNotice(path: string) {
        await this.expectNoticeElWithText(
            "Templater 错误:\n" +
                `加载用户脚本“${path}”失败。\n` +
                "请查看控制台了解详细信息",
        );
    }

    async expectMigrationNotice(affectedSettings: string[]) {
        await this.expectNoticeElWithText(
            "Templater：以下设置已重置，因为它们" +
                "现在仅保存在当前设备上：" +
                affectedSettings.join(", ") +
                "。如果你信任此仓库，请在 Templater 设置中重新启用。",
        );
    }

    async expectNoErrorNotice() {
        // eslint-disable-next-line wdio/no-pause -- Give an error notice time to appear before asserting there is none
        await browser.pause(500);
        const isDisplayed = await this.#noticeEl
            .isDisplayed()
            .catch(() => false);
        expect(isDisplayed).toBe(false);
    }

    async dismissAll() {
        let attempts = 0;
        const maxAttempts = 10;

        try {
            while (
                attempts < maxAttempts &&
                this.#noticeEl &&
                (await this.#noticeEl.isDisplayed())
            ) {
                await this.#noticeEl.click();
                attempts++;
            }
        } catch {
            // Notice doesn't exist or error occurred, continue
        }
    }
}

export default new Notice();
