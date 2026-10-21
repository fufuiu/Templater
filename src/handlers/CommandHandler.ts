import TemplaterPlugin from "main";
import { normalizePath, TFile, TFolder } from "obsidian";
import {
    resolve_template_hotkey,
    type TemplateHotkeyEntry,
} from "settings/TemplateHotkeys";
import { errorWrapperSync } from "utils/Error";
import {
    resolve_tfile,
    resolve_tfolder,
    get_folder_path_from_file_path,
} from "utils/Utils";

export class CommandHandler {
    private registered_hotkey_templates = new Set<string>();

    constructor(private plugin: TemplaterPlugin) {}

    setup(): void {
        this.plugin.addCommand({
            id: "insert-templater",
            name: "打开插入模板窗口",
            icon: "templater-icon",
            callback: () => {
                this.plugin.fuzzy_suggester.insert_template();
            },
        });

        this.plugin.addCommand({
            id: "replace-in-file-templater",
            name: "执行并替换当前文件中的模板命令",
            icon: "templater-icon",
            callback: async () => {
                await this.plugin.templater.overwrite_active_file_commands();
            },
        });

        this.plugin.addCommand({
            id: "jump-to-next-cursor-location",
            name: "跳转到下一个光标位置",
            icon: "text-cursor",
            callback: async () => {
                await this.plugin.editor_handler.jump_to_next_cursor_location();
            },
        });

        this.plugin.addCommand({
            id: "create-new-note-from-template",
            name: "从模板创建新笔记",
            icon: "templater-icon",
            callback: () => {
                this.plugin.fuzzy_suggester.create_new_note_from_template();
            },
        });

        this.register_templates_hotkeys();
        this.register_cli_handler();
    }

    register_templates_hotkeys(): void {
        this.plugin.settings.enabled_templates_hotkeys.forEach((entry) => {
            this.add_template_hotkey(entry);
        });
    }

    sync_template_hotkeys(): void {
        for (const template of [...this.registered_hotkey_templates]) {
            this.remove_template_hotkey(template);
        }
        this.register_templates_hotkeys();
    }

    add_template_hotkey(entry: TemplateHotkeyEntry): void {
        const hotkey = resolve_template_hotkey(entry);
        const template_path = hotkey.template;
        if (!template_path) {
            return;
        }

        this.remove_template_hotkey(template_path);

        // Determine started index based on templates folder
        const template_start_index = this.plugin.settings.templates_folder
            ? this.plugin.settings.templates_folder.length + 1
            : 0;

        const template_name = template_path.slice(template_start_index, -3);

        const resolve_template = () =>
            errorWrapperSync(
                () => resolve_tfile(this.plugin.app, template_path),
                `找不到此快捷键关联的模板文件`,
            );

        if (hotkey.insert_enabled) {
            this.plugin.addCommand({
                id: template_path,
                name: `插入 ${template_name}`,
                icon: "templater-icon",
                callback: async () => {
                    const template = resolve_template();
                    if (!template) {
                        return;
                    }
                    await this.plugin.templater.append_template_to_active_file(
                        template,
                    );
                },
            });
        }
        if (hotkey.create_enabled) {
            this.plugin.addCommand({
                id: `create-${template_path}`,
                name: `创建 ${template_name}`,
                icon: "templater-icon",
                callback: async () => {
                    const template = resolve_template();
                    if (!template) {
                        return;
                    }
                    await this.plugin.templater.create_new_note_from_template(
                        template,
                    );
                },
            });
        }

        this.registered_hotkey_templates.add(template_path);
    }

    remove_template_hotkey(template: string | null): void {
        if (template) {
            this.plugin.removeCommand(`${template}`);
            this.plugin.removeCommand(`create-${template}`);
            this.registered_hotkey_templates.delete(template);
        }
    }

    register_cli_handler(): void {
        this.plugin.registerCliHandler(
            "templater:create-from-template",
            "从 Templater 模板创建新笔记",
            {
                template: {
                    value: "<path>",
                    description:
                        "模板文件路径（相对于仓库根目录或模板文件夹）",
                    required: true,
                },
                file: {
                    value: "<path>",
                    description: "输出文件路径（相对于仓库根目录）",
                    required: true,
                },
                open: {
                    description: "在界面中打开创建的文件",
                    required: false,
                },
            },
            async (params) => this.handle_create_from_template(params),
        );
    }

    private resolve_template_file(template: string): TFile {
        let template_path = template;
        if (!template_path.endsWith(".md")) {
            template_path = `${template_path}.md`;
        }

        try {
            return resolve_tfile(this.plugin.app, template_path);
        } catch {
            const templates_folder = this.plugin.settings.templates_folder;
            if (templates_folder) {
                const full_path = normalizePath(
                    `${templates_folder}/${template_path}`,
                );
                return resolve_tfile(this.plugin.app, full_path);
            }
            throw new Error(`找不到模板“${template}”`);
        }
    }

    private async handle_create_from_template(
        params: Record<string, string>,
    ): Promise<string> {
        const { template, file, open } = params;

        if (!template) {
            return "Error: 缺少必填参数 template";
        }
        if (!file) {
            return "Error: 缺少必填参数 file";
        }

        try {
            const template_file = this.resolve_template_file(template);

            const file_path = normalizePath(file);
            const folder_path = get_folder_path_from_file_path(file_path);
            const filename = file_path
                .slice(folder_path.length + 1)
                .replace(/\.md$/, "");

            let folder: TFolder | undefined;
            if (folder_path) {
                try {
                    folder = resolve_tfolder(this.plugin.app, folder_path);
                } catch {
                    // Folder will be created by create_new_note_from_template
                }
            }

            const open_note = open === "true";
            const created_file =
                await this.plugin.templater.create_new_note_from_template(
                    template_file,
                    folder ?? folder_path,
                    filename,
                    open_note,
                );

            if (created_file) {
                return created_file.path;
            }
            return "Error: 从模板创建笔记失败";
        } catch (error) {
            return `Error: ${error instanceof Error ? error.message : String(error)}`;
        }
    }
}
