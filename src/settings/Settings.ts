import TemplaterPlugin from "main";
import {
    type SettingDefinitionItem,
    type SettingDefinitionList,
    type SettingGroupItem,
    debounce,
    PluginSettingTab,
} from "obsidian";
import { arraymove } from "utils/Utils";
import { ConfirmDangerousSettingModal } from "./modals/ConfirmDangerousSettingModal";
import { FileRegexTemplateModal } from "./modals/FileRegexTemplateModal";
import { FolderTemplateModal } from "./modals/FolderTemplateModal";
import { IgnoreFolderModal } from "./modals/IgnoreFolderModal";
import { StartupTemplateModal } from "./modals/StartupTemplateModal";
import { SystemCommandModal } from "./modals/SystemCommandModal";
import { TemplateHotkeyModal } from "./modals/TemplateHotkeyModal";
import { IntellisenseRenderOption } from "./RenderSettings/IntellisenseRenderOption";
import {
    DEFAULT_LOCAL_SETTINGS,
    type LocalSettings,
    getLocalSettings,
    saveLocalSetting,
} from "./LocalSettings";
import { set } from "utils/set";
import { get, type Paths } from "utils/get";
import {
    describe_template_hotkey_commands,
    resolve_template_hotkey,
    serialize_template_hotkey,
    type ResolvedTemplateHotkey,
    type TemplateHotkeyEntry,
} from "./TemplateHotkeys";
import { UserScriptsPage } from "./UserScriptsPage";

export interface FolderTemplate {
    folder: string;
    template: string;
}

export interface FileTemplate {
    regex: string;
    template: string;
}

export interface IgnoreFolderOnCreation {
    folder: string;
}

export const DEFAULT_SETTINGS: Settings = {
    data_version: 2,
    command_timeout: 5,
    templates_folder: "",
    templates_pairs: [],
    trigger_on_file_creation_mode: "none",
    auto_jump_to_cursor: false,
    jump_to_cursor_after_file_name: false,
    shell_path: "",
    user_scripts_folder: "",
    folder_templates: [],
    file_templates: [],
    syntax_highlighting: true,
    syntax_highlighting_mobile: false,
    enabled_templates_hotkeys: [],
    startup_templates: [],
    intellisense_render:
        IntellisenseRenderOption.RenderDescriptionParameterReturn,
    ignore_folders_on_creation: [],
};

export interface Settings {
    data_version: number;
    templates_folder: string;
    syntax_highlighting: boolean;
    syntax_highlighting_mobile: boolean;
    auto_jump_to_cursor: boolean;
    jump_to_cursor_after_file_name: boolean;
    trigger_on_file_creation_mode: "none" | "folder" | "regex";
    folder_templates: Array<FolderTemplate>;
    file_templates: Array<FileTemplate>;
    ignore_folders_on_creation: Array<IgnoreFolderOnCreation>;
    command_timeout: number;
    templates_pairs: Array<[string, string]>;
    shell_path: string;
    user_scripts_folder: string;
    enabled_templates_hotkeys: Array<TemplateHotkeyEntry>;
    startup_templates: Array<string>;
    intellisense_render: IntellisenseRenderOption;
}

export function isSettingsV2(obj: unknown): obj is Settings {
    return !!(
        obj &&
        typeof obj === "object" &&
        "data_version" in obj &&
        (obj as Record<string, unknown>)["data_version"] === 2
    );
}

export class TemplaterSettingTab extends PluginSettingTab {
    icon = "templater-icon";

    constructor(private plugin: TemplaterPlugin) {
        super(plugin.app, plugin);
        // Obsidian's page-row handler intercepts clicks in the capture phase,
        // so onclick/addEventListener on the <a> itself never fires.
        // Adding a capture listener here (on the ancestor) fires first and lets
        // external links open without triggering sub-page navigation.
        this.containerEl.addEventListener(
            "click",
            (e) => {
                if (
                    e.target &&
                    "href" in e.target &&
                    e.target.href &&
                    typeof e.target.href === "string"
                ) {
                    e.stopPropagation();
                }
            },
            true,
        );

        const refresh = debounce(() => this.update(), 200, true);
        plugin.registerEvent(this.app.vault.on("create", refresh));
        plugin.registerEvent(this.app.vault.on("delete", refresh));
        plugin.registerEvent(this.app.vault.on("rename", refresh));
    }

    private isLocalSettingsKey(key: string): key is keyof LocalSettings {
        return key in DEFAULT_LOCAL_SETTINGS;
    }

    // Overriding `getControlValue` to support dot notation keys for nested settings
    getControlValue(key: Paths<Settings> | keyof LocalSettings): unknown {
        if (this.isLocalSettingsKey(key)) {
            return getLocalSettings(this.plugin.app)[key];
        }
        return get(this.plugin.settings, key);
    }

    // Overriding `setControlValue` to trigger UI changes on save,
    // and to support dot notation keys for nested settings
    async setControlValue(
        key: keyof Settings | keyof LocalSettings,
        value: unknown,
    ) {
        const dangerousConfig: Partial<
            Record<keyof LocalSettings, { title: string; warning: string }>
        > = {
            enable_startup_templates: {
                title: "启用启动模板",
                warning:
                    "启动模板包含未知或不安全的内容时，启用此选项可能带来风险。请确保每个启动模板的内容都安全。",
            },
            trigger_on_file_creation: {
                title: "创建新文件时触发 Templater",
                warning:
                    "新建文件包含未知或不安全的内容时，启用此选项可能带来风险。请确保每个新文件在创建时的内容都安全。",
            },
            enable_system_commands: {
                title: "启用用户系统命令函数",
                warning:
                    "执行来源不可信的任意系统命令可能带来风险。请只运行你了解且来源可信的系统命令。",
            },
        };

        if (
            this.isLocalSettingsKey(key) &&
            value === true &&
            key in dangerousConfig
        ) {
            const config = dangerousConfig[key]!;
            new ConfirmDangerousSettingModal(
                this.app,
                config.title,
                config.warning,
                async () => {
                    await this.commitControlValue(key, value);
                },
            ).open();
            this.update();
            return;
        }

        await this.commitControlValue(key, value);
    }

    private async commitControlValue(
        key: keyof Settings | keyof LocalSettings,
        value: unknown,
    ) {
        if (this.isLocalSettingsKey(key)) {
            saveLocalSetting(
                this.plugin.app,
                key,
                value as LocalSettings[typeof key],
            );
        } else {
            set(this.plugin.settings, key as Paths<Settings>, value);
        }
        const rerenderKeys = [
            "trigger_on_file_creation",
            "trigger_on_file_creation_mode",
            "enable_startup_templates",
            "enable_system_commands",
        ];
        if (rerenderKeys.contains(key)) {
            this.update();
        }
        await this.plugin.save_settings();
    }

    getSettingDefinitions(): SettingDefinitionItem<
        keyof Settings | keyof LocalSettings
    >[] {
        const items: SettingDefinitionItem<
            keyof Settings | keyof LocalSettings
        >[] = [];
        const localSettings = getLocalSettings(this.plugin.app);

        items.push({
            type: "group",
            items: [
                {
                    name: "内置变量与函数",
                    desc: (() => {
                        const internalFunctionsDesc = createFragment();
                        internalFunctionsDesc.append(
                            "Templater 提供了多种可直接使用的内置变量和函数。",
                            internalFunctionsDesc.createEl("br"),
                            "查看",
                            internalFunctionsDesc.createEl("a", {
                                href: "https://silentvoid13.github.io/Templater/",
                                text: "文档",
                            }),
                            "，了解所有可用的内置变量和函数。",
                        );
                        return internalFunctionsDesc;
                    })(),
                },
                {
                    name: "模板文件夹位置",
                    desc: "此文件夹中的文件可作为模板使用。",
                    control: {
                        type: "folder",
                        key: "templates_folder",
                    },
                },
                {
                    type: "page",
                    name: "模板快捷键",
                    desc: (() => {
                        const templateHotkeysDesc = createFragment();
                        templateHotkeysDesc.append(
                            "将模板绑定到",
                            templateHotkeysDesc.createEl("a", {
                                href: "https://obsidian.md/help/plugins/command-palette",
                                text: "命令",
                            }),
                            "，再将命令绑定到",
                            templateHotkeysDesc.createEl("a", {
                                href: "https://obsidian.md/help/hotkeys",
                                text: "快捷键",
                            }),
                            "（在“快捷键”设置中配置）。",
                        );
                        return templateHotkeysDesc;
                    })(),
                    items: [
                        {
                            name: "尚未设置模板文件夹，请返回上一页设置模板文件夹位置。",
                            searchable: false,
                            visible: () =>
                                !this.plugin.settings.templates_folder,
                        },
                        this.templateHotkeysGroup(),
                    ],
                },
                {
                    name: "自动跳转到光标位置",
                    desc: (() => {
                        const autoJumpDesc = createFragment();
                        autoJumpDesc.append(
                            "插入模板后自动触发 ",
                            autoJumpDesc.createEl("code", {
                                text: "tp.file.cursor",
                            }),
                            "。",
                            autoJumpDesc.createEl("br"),
                            "你也可以设置快捷键，手动触发 ",
                            autoJumpDesc.createEl("code", {
                                text: "tp.file.cursor",
                            }),
                            ".",
                        );
                        return autoJumpDesc;
                    })(),
                    control: { type: "toggle", key: "auto_jump_to_cursor" },
                },
                {
                    name: "创建笔记后跳转到正文",
                    desc: "从模板创建新笔记时，跳过重命名提示，直接将光标移至笔记正文。",
                    control: {
                        type: "toggle",
                        key: "jump_to_cursor_after_file_name",
                    },
                },
            ],
        });

        items.push({
            type: "group",
            heading: "语法高亮",
            items: [
                {
                    name: "桌面端语法高亮",
                    desc: "在编辑模式中为 Templater 命令启用语法高亮。",
                    control: {
                        type: "toggle",
                        key: "syntax_highlighting",
                    },
                },
                {
                    name: "移动端语法高亮",
                    desc: "在移动端的编辑模式中为 Templater 命令启用语法高亮。请谨慎使用：此功能可能导致移动端的实时预览异常。",
                    control: {
                        type: "toggle",
                        key: "syntax_highlighting_mobile",
                    },
                },
            ],
        });

        items.push({
            type: "group",
            heading: "文件创建",
            items: this.fileCreationGroup(localSettings),
        });

        items.push({
            type: "group",
            heading: "启动模板",
            items: [
                {
                    name: "启用启动模板",
                    desc: createFragment((f) => {
                        f.append(
                            "允许模板在 Templater 启动时自动运行。",
                            createEl("br"),
                            createEl("br"),
                            createSpan({
                                text: "此设置仅保存在当前设备上，需要在每台设备上分别启用。",
                                cls: "mod-warning",
                            }),
                        );
                    }),
                    control: {
                        type: "toggle",
                        key: "enable_startup_templates",
                    },
                },
                {
                    type: "page",
                    name: "启动模板",
                    desc: "在 Templater 启动时运行一次的模板。这些模板不输出内容，可用于注册事件钩子。",
                    items: [this.startupTemplatesGroup()],
                    visible: () => localSettings.enable_startup_templates,
                },
            ],
        });

        items.push({
            type: "group",
            heading: "用户脚本",
            items: this.userScriptItems(),
        });

        items.push({
            type: "group",
            heading: "用户系统命令",
            items: this.systemCommandItems(localSettings),
        });

        return items;
    }

    private fileCreationGroup(
        localSettings: LocalSettings,
    ): SettingGroupItem<keyof Settings | keyof LocalSettings>[] {
        const triggerDesc = createFragment();
        triggerDesc.append(
            "Templater 会监听新文件的创建事件；当文件符合你设置的规则时，会执行并替换新文件内容中的所有模板命令。",
            "因此可与日记（Daily notes）核心插件、Calendar、Review、Note refactor 等插件配合使用。",
            createEl("br"),
            createEl("br"),
            createSpan({
                text: "此设置仅保存在当前设备上，需要在每台设备上分别启用。",
                cls: "mod-warning",
            }),
        );
        const modeDescList = createEl("ul");
        modeDescList.appendChild(
            createEl("li", {
                text: "无：不自动应用模板，但仍监听新文件的创建事件，执行并替换新文件内容中的所有模板命令。",
            }),
        );
        modeDescList.appendChild(
            createEl("li", {
                text: "文件夹模板：根据文件夹结构应用模板。",
            }),
        );
        modeDescList.appendChild(
            createEl("li", {
                text: "文件正则模板：根据文件名的正则匹配规则应用模板。",
            }),
        );
        const modeDesc = createFragment();
        modeDesc.append(
            "选择创建文件时触发模板的匹配方式。",
            modeDesc.createEl("br"),
            modeDescList,
        );

        const folderTriggerDesc = createFragment();
        folderTriggerDesc.append(
            "匹配成功后，Templater 会将对应模板应用到新文件。",
            folderTriggerDesc.createEl("br"),
            "优先使用匹配层级最深的文件夹规则，因此子文件夹的规则优先于父文件夹。",
            folderTriggerDesc.createEl("br"),
            "如需匹配所有文件，可添加规则 ",
            folderTriggerDesc.createEl("code", { text: "/" }),
            "。",
        );

        const fileRegexTriggerDesc = createFragment();
        fileRegexTriggerDesc.append(
            "根据你定义的文件路径正则匹配规则应用模板。",
            fileRegexTriggerDesc.createEl("br"),
            "文件正则模板按顺序匹配；如果文件符合多条规则，只应用第一个匹配的模板。",
            fileRegexTriggerDesc.createEl("br"),
            "如需匹配所有文件，可添加规则 ",
            fileRegexTriggerDesc.createEl("code", { text: ".*" }),
            "。",
        );

        return [
            {
                name: "创建新文件时触发 Templater",
                desc: triggerDesc,
                control: {
                    type: "toggle",
                    key: "trigger_on_file_creation",
                },
            },
            {
                type: "page",
                name: "排除的文件夹",
                desc: "在这些文件夹中创建新文件时，不会触发 Templater。",
                items: [this.ignoreFoldersGroup()],
                visible: () => localSettings.trigger_on_file_creation,
            },
            {
                name: "模板匹配方式",
                desc: modeDesc,
                control: {
                    type: "dropdown",
                    key: "trigger_on_file_creation_mode",
                    options: {
                        none: "无",
                        folder: "文件夹模板",
                        regex: "文件正则模板",
                    },
                },
                visible: () => localSettings.trigger_on_file_creation,
            },
            {
                type: "page",
                name: "文件夹模板",
                desc: folderTriggerDesc,
                items: [this.folderTemplatesGroup()],
                visible: () =>
                    localSettings.trigger_on_file_creation &&
                    this.plugin.settings.trigger_on_file_creation_mode ===
                        "folder",
            },
            {
                type: "page",
                name: "文件正则模板",
                desc: fileRegexTriggerDesc,
                items: [this.fileTemplatesGroup()],
                visible: () =>
                    localSettings.trigger_on_file_creation &&
                    this.plugin.settings.trigger_on_file_creation_mode ===
                        "regex",
            },
        ];
    }

    private templateHotkeysGroup(): SettingDefinitionList<keyof Settings> {
        const openModal = (
            initialValues: ResolvedTemplateHotkey,
            onSubmit: (hotkey: ResolvedTemplateHotkey) => Promise<void> | void,
            excludeIndex?: number,
        ) => {
            new TemplateHotkeyModal(
                this.app,
                this.plugin,
                initialValues,
                onSubmit,
                (template) => {
                    if (
                        this.plugin.settings.enabled_templates_hotkeys.some(
                            (entry, i) =>
                                resolve_template_hotkey(entry).template ===
                                    template && i !== excludeIndex,
                        )
                    ) {
                        return "此模板已配置快捷键";
                    }
                },
            ).open();
        };

        return {
            type: "list",
            addItem: {
                name: "添加模板快捷键",
                action: () => {
                    openModal(
                        {
                            template: "",
                            insert_enabled: true,
                            create_enabled: true,
                        },
                        async (hotkey) => {
                            this.plugin.settings.enabled_templates_hotkeys.push(
                                serialize_template_hotkey(hotkey),
                            );
                            this.plugin.command_handler.sync_template_hotkeys();
                            this.update();
                            await this.plugin.save_settings();
                        },
                    );
                },
            },
            onDelete: (index) => {
                this.plugin.settings.enabled_templates_hotkeys.splice(index, 1);
                this.plugin.command_handler.sync_template_hotkeys();
                this.update();
                void this.plugin.save_settings();
            },
            emptyState: "尚未添加模板快捷键。",
            items: this.plugin.settings.enabled_templates_hotkeys.map(
                (entry, index) => {
                    const hotkey = resolve_template_hotkey(entry);
                    return {
                        name: hotkey.template,
                        desc: describe_template_hotkey_commands(hotkey),
                        searchable: false,
                        action: () => {
                            openModal(
                                hotkey,
                                async (updated) => {
                                    this.plugin.settings.enabled_templates_hotkeys[
                                        index
                                    ] = serialize_template_hotkey(updated);
                                    this.plugin.command_handler.sync_template_hotkeys();
                                    this.update();
                                    await this.plugin.save_settings();
                                },
                                index,
                            );
                        },
                    };
                },
            ),
        };
    }

    private ignoreFoldersGroup(): SettingDefinitionList<keyof Settings> {
        return {
            type: "list",
            addItem: {
                name: "添加文件夹",
                action: () => {
                    new IgnoreFolderModal(this.app, (folder) => {
                        this.plugin.settings.ignore_folders_on_creation.push({
                            folder,
                        });
                        this.update();
                        void this.plugin.save_settings();
                    }).open();
                },
            },
            onDelete: (index) => {
                this.plugin.settings.ignore_folders_on_creation.splice(
                    index,
                    1,
                );
                this.update();
                void this.plugin.save_settings();
            },
            emptyState: "尚未添加排除规则。",
            items: this.plugin.settings.ignore_folders_on_creation.map(
                (entry) => ({
                    name: entry.folder,
                    searchable: false,
                }),
            ),
        };
    }

    private folderTemplatesGroup(): SettingDefinitionList<keyof Settings> {
        const openModal = (
            initialValues: { folder: string; template: string },
            onSubmit: (
                folder: string,
                template: string,
            ) => Promise<void> | void,
            excludeIndex?: number,
        ) => {
            new FolderTemplateModal(
                this.app,
                this.plugin,
                initialValues,
                onSubmit,
                (folder) => {
                    if (
                        this.plugin.settings.folder_templates.some(
                            (e, i) => e.folder === folder && i !== excludeIndex,
                        )
                    ) {
                        return "此文件夹已关联模板";
                    }
                },
            ).open();
        };

        return {
            type: "list",
            addItem: {
                name: "添加文件夹模板",
                action: () => {
                    openModal(
                        { folder: "", template: "" },
                        (folder, template) => {
                            this.plugin.settings.folder_templates.push({
                                folder,
                                template,
                            });
                            this.update();
                            void this.plugin.save_settings();
                        },
                    );
                },
            },
            onReorder: (oldIndex, newIndex) => {
                arraymove(
                    this.plugin.settings.folder_templates,
                    oldIndex,
                    newIndex,
                );
                this.update();
                void this.plugin.save_settings();
            },
            onDelete: (index) => {
                this.plugin.settings.folder_templates.splice(index, 1);
                this.update();
                void this.plugin.save_settings();
            },
            emptyState: "尚未添加文件夹模板。",
            items: this.plugin.settings.folder_templates.map(
                (folder_template, index) => ({
                    name: folder_template.folder,
                    desc: folder_template.template,
                    action: () => {
                        openModal(
                            {
                                folder: folder_template.folder,
                                template: folder_template.template,
                            },
                            async (folder, template) => {
                                this.plugin.settings.folder_templates[
                                    index
                                ].folder = folder;
                                this.plugin.settings.folder_templates[
                                    index
                                ].template = template;
                                this.update();
                                await this.plugin.save_settings();
                            },
                            index,
                        );
                    },
                }),
            ),
        };
    }

    private fileTemplatesGroup(): SettingDefinitionList<keyof Settings> {
        const openModal = (
            initialValues: { regex: string; template: string },
            onSubmit: (regex: string, template: string) => Promise<void> | void,
        ) => {
            new FileRegexTemplateModal(
                this.app,
                this.plugin,
                initialValues,
                onSubmit,
            ).open();
        };

        return {
            type: "list",
            addItem: {
                name: "添加文件正则模板",
                action: () => {
                    openModal(
                        { regex: "", template: "" },
                        (regex, template) => {
                            this.plugin.settings.file_templates.push({
                                regex,
                                template,
                            });
                            this.update();
                            void this.plugin.save_settings();
                        },
                    );
                },
            },
            onReorder: (oldIndex, newIndex) => {
                arraymove(
                    this.plugin.settings.file_templates,
                    oldIndex,
                    newIndex,
                );
                this.update();
                void this.plugin.save_settings();
            },
            onDelete: (index) => {
                this.plugin.settings.file_templates.splice(index, 1);
                this.update();
                void this.plugin.save_settings();
            },
            emptyState: "尚未添加文件正则模板。",
            items: this.plugin.settings.file_templates.map(
                (file_template, index) => ({
                    name: file_template.regex,
                    desc: file_template.template,
                    action: () => {
                        openModal(
                            {
                                regex: file_template.regex,
                                template: file_template.template,
                            },
                            async (regex, template) => {
                                this.plugin.settings.file_templates[
                                    index
                                ].regex = regex;
                                this.plugin.settings.file_templates[
                                    index
                                ].template = template;
                                this.update();
                                await this.plugin.save_settings();
                            },
                        );
                    },
                }),
            ),
        };
    }

    private startupTemplatesGroup(): SettingDefinitionList<keyof Settings> {
        return {
            type: "list",
            addItem: {
                name: "添加启动模板",
                action: () => {
                    new StartupTemplateModal(
                        this.app,
                        this.plugin,
                        (template) => {
                            this.plugin.settings.startup_templates.push(
                                template,
                            );
                            this.update();
                            void this.plugin.save_settings();
                        },
                    ).open();
                },
            },
            onDelete: (index) => {
                this.plugin.settings.startup_templates.splice(index, 1);
                this.update();
                void this.plugin.save_settings();
            },
            emptyState: "尚未添加启动模板。",
            items: this.plugin.settings.startup_templates.map((template) => ({
                name: template,
                searchable: false,
            })),
        };
    }

    private userScriptItems(): SettingGroupItem<keyof Settings>[] {
        const items: SettingGroupItem<keyof Settings>[] = [];
        items.push({
            name: "用户脚本文件夹",
            desc: (() => {
                const desc = createFragment();
                desc.append(
                    "此文件夹中的所有 JavaScript 文件都将作为 CommonJS 模块加载，以导入自定义用户函数。",
                    desc.createEl("br"),
                    "此文件夹必须位于当前仓库可访问的位置。",
                    desc.createEl("br"),
                    "查看",
                    desc.createEl("a", {
                        href: "https://silentvoid13.github.io/Templater/",
                        text: "文档",
                    }),
                    "，了解更多信息。",
                );
                return desc;
            })(),
            control: {
                type: "folder",
                key: "user_scripts_folder",
            },
        });

        items.push({
            name: "用户脚本智能提示",
            desc: "选择用户脚本智能提示的显示内容。脚本中未提供的信息不会显示。",
            control: {
                type: "dropdown",
                key: "intellisense_render",
                options: {
                    0: "关闭智能提示",
                    1: "显示函数说明、参数列表和返回值",
                    2: "显示函数说明和参数列表",
                    3: "显示函数说明和返回值",
                    4: "显示函数说明",
                },
            },
        });

        items.push({
            type: "page",
            name: "用户脚本",
            searchable: false,
            page: () => new UserScriptsPage(this, this.plugin),
        });

        return items;
    }

    private systemCommandItems(
        localSettings: LocalSettings,
    ): SettingGroupItem<keyof Settings | keyof LocalSettings>[] {
        const shellDesc = createFragment();
        shellDesc.append(
            "用于执行命令的 Shell 程序的完整路径。",
            shellDesc.createEl("br"),
            "此设置为可选项，留空时使用系统默认 Shell。",
            shellDesc.createEl("br"),
            "在所有平台上都可以使用正斜杠（",
            shellDesc.createEl("code", { text: "/" }),
            "）作为路径分隔符。",
        );

        return [
            {
                name: "启用用户系统命令函数",
                desc: createFragment((f) => {
                    f.append(
                        "允许创建与系统命令关联的用户函数。",
                        createEl("br"),
                        createEl("br"),
                        createSpan({
                            text: "此设置仅保存在当前设备上，需要在每台设备上分别启用。",
                            cls: "mod-warning",
                        }),
                    );
                }),
                control: {
                    type: "toggle",
                    key: "enable_system_commands",
                },
            },
            {
                name: "超时时间",
                desc: "系统命令的最长执行时间，单位为秒。",
                control: {
                    type: "number",
                    key: "command_timeout",
                    validate: (value) => {
                        if (isNaN(value) || value <= 0) {
                            return "超时时间必须为正数";
                        }
                        return undefined;
                    },
                },
                visible: () => localSettings.enable_system_commands,
            },
            {
                name: "Shell 程序位置",
                desc: shellDesc,
                control: {
                    type: "text",
                    key: "shell_path",
                    placeholder: "/bin/bash",
                },
                visible: () => localSettings.enable_system_commands,
            },
            {
                type: "page",
                name: "用户系统命令函数",
                items: [this.systemCommandPairsGroup()],
                visible: () => localSettings.enable_system_commands,
            },
        ];
    }

    private systemCommandPairsGroup(): SettingDefinitionList<keyof Settings> {
        const openModal = (
            initialValues: { name: string; command: string },
            onSubmit: (name: string, command: string) => Promise<void> | void,
            excludeIndex?: number,
        ) => {
            new SystemCommandModal(
                this.app,
                initialValues,
                onSubmit,
                (name) => {
                    if (
                        this.plugin.settings.templates_pairs.some(
                            (p, i) => p[0] === name && i !== excludeIndex,
                        )
                    ) {
                        return "此函数名已被使用";
                    }
                    return undefined;
                },
            ).open();
        };

        return {
            type: "list",
            addItem: {
                name: "添加用户函数",
                action: () => {
                    openModal({ name: "", command: "" }, (name, command) => {
                        this.plugin.settings.templates_pairs.push([
                            name,
                            command,
                        ]);
                        this.update();
                        void this.plugin.save_settings();
                    });
                },
            },
            onDelete: (index) => {
                this.plugin.settings.templates_pairs.splice(index, 1);
                this.update();
                void this.plugin.save_settings();
            },
            emptyState: "尚未添加用户函数。",
            items: this.plugin.settings.templates_pairs.map(
                (template_pair, index) => ({
                    name: template_pair[0],
                    desc: template_pair[1] || undefined,
                    searchable: false,
                    action: () => {
                        openModal(
                            {
                                name: template_pair[0],
                                command: template_pair[1],
                            },
                            async (name, command) => {
                                this.plugin.settings.templates_pairs[index][0] =
                                    name;
                                this.plugin.settings.templates_pairs[index][1] =
                                    command;
                                this.update();
                                await this.plugin.save_settings();
                            },
                            index,
                        );
                    },
                }),
            ),
        };
    }
}
