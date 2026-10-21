import { TFile } from "obsidian";
import TemplaterPlugin from "main";
import { IGenerateObject } from "../IGenerateObject";
import { get_tfiles_from_folder } from "utils/Utils";
import { errorWrapperSync, TemplaterError } from "utils/Error";
import { UserScriptFunction } from "types";

type UserScriptRequire = (s: string) => unknown;
type UserScriptExports = Record<string, UserScriptFunction>;
type UserScriptModule = { exports: UserScriptExports };
type UserScriptWrapper = (
    require: UserScriptRequire,
    module: UserScriptModule,
    exports: UserScriptExports,
) => void;

let script_counter = 0;

async function evaluate_user_script(
    file_content: string,
): Promise<UserScriptWrapper> {
    const key = `__templater_user_script_${script_counter++}`;
    const url = URL.createObjectURL(
        new Blob(
            [
                `window[${JSON.stringify(key)}] = (function anonymous(require, module, exports){` +
                    file_content +
                    "\n});",
            ],
            { type: "text/javascript" },
        ),
    );
    const global_scope = window as unknown as Record<string, unknown>;
    const script = createEl("script");
    script.src = url;

    let script_error: string | undefined;
    const on_error = (event: ErrorEvent) => {
        if (event.filename === url) {
            script_error = event.message;
        }
    };
    window.addEventListener("error", on_error);

    let wrapping_fn: UserScriptWrapper | undefined;
    try {
        await new Promise<void>((resolve) => {
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });
        wrapping_fn = global_scope[key] as UserScriptWrapper | undefined;
    } finally {
        delete global_scope[key];
        window.removeEventListener("error", on_error);
        script.remove();
        URL.revokeObjectURL(url);
    }

    if (!wrapping_fn) {
        // Thrown bare so the caller can attribute it to the offending file.
        throw new Error(script_error ?? "无法执行脚本。");
    }
    return wrapping_fn;
}

export class UserScriptFunctions implements IGenerateObject {
    constructor(private plugin: TemplaterPlugin) {}

    async generate_user_script_functions(): Promise<
        Map<string, UserScriptFunction>
    > {
        const user_script_functions: Map<string, UserScriptFunction> =
            new Map();
        const files = errorWrapperSync(
            () =>
                get_tfiles_from_folder(
                    this.plugin.app,
                    this.plugin.settings.user_scripts_folder,
                ),
            `找不到用户脚本文件夹“${this.plugin.settings.user_scripts_folder}”`,
        );
        if (!files) {
            return new Map();
        }

        for (const file of files) {
            if (file.extension.toLowerCase() === "js") {
                await this.load_user_script_function(
                    file,
                    user_script_functions,
                );
            }
        }
        return user_script_functions;
    }

    async load_user_script_function(
        file: TFile,
        user_script_functions: Map<string, UserScriptFunction>,
    ): Promise<void> {
        const req: UserScriptRequire = (s: string): unknown => {
            return window.require && window.require(s);
        };
        const exp: UserScriptExports = {};
        const mod: UserScriptModule = {
            exports: exp,
        };

        const file_content = await this.plugin.app.vault.read(file);
        try {
            const wrapping_fn = await evaluate_user_script(file_content);
            wrapping_fn(req, mod, exp);
        } catch (err) {
            throw new TemplaterError(
                `加载用户脚本“${file.path}”失败。`,
                err instanceof Error ? err.message : String(err),
            );
        }
        const exported = exp["default"] ?? mod.exports;

        if (!exported) {
            throw new TemplaterError(
                `加载用户脚本“${file.path}”失败：未检测到导出内容。`,
            );
        }

        if (typeof exported === "function") {
            // ✅ Case 1: The export is a single function
            user_script_functions.set(file.basename, exported);
        } else if (typeof exported === "object" && exported !== null) {
            // ✅ Case 2: The export is an object, check if all values are functions
            const allValuesAreFunctions = Object.values(exported).every(
                (v) => typeof v === "function",
            );

            if (!allValuesAreFunctions) {
                // ❌ Error: The exported object contains non-function values
                throw new TemplaterError(
                    `“${file.path}”导出的对象只能包含函数。`,
                );
            }

            // ✅ Case 2-1: The export is an object and all values are functions
            user_script_functions.set(file.basename, exported);
        }
        // ❌ Error: The export is neither a function nor an object of functions
        else {
            throw new TemplaterError(
                `“${file.path}”的导出内容无效，必须为函数或仅包含函数的对象。`,
            );
        }
    }

    async generate_object(): Promise<Record<string, UserScriptFunction>> {
        const user_script_functions =
            await this.generate_user_script_functions();
        return Object.fromEntries(user_script_functions);
    }
}
