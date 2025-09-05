import { Notice, Plugin } from "obsidian";
import { js_beautify } from "js-beautify";

interface PrettierCodeBlocksSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: PrettierCodeBlocksSettings = {
	mySetting: "default",
};

export default class PrettierCodeBlocks extends Plugin {
	settings: PrettierCodeBlocksSettings;

	async onload() {
		await this.loadSettings();

		// Command used to format all codeblocks in a file using Ctrl + Alt + l
		this.addCommand({
			id: "format-code-blocks",
			name: "Format all code blocks",
			hotkeys: [{ modifiers: ["Ctrl", "Alt"], key: "l" }],
			callback: async () => {
				// Selects the file currently in use
				const active = this.app.workspace.getActiveFile();
				if (!active) {
					new Notice("No active file open.");
					return;
				}

				// Get all content of the file
				const content = await this.app.vault.read(active);
				// Regex to find codeblocks
				const codeBlockRegex = /```(bash|sh)\n([\s\S]*?)```/g;

				let match;
				let result = "";
				let lastIndex = 0;
				let changed = false;

				while ((match = codeBlockRegex.exec(content)) !== null) {
					const [fullMatch, lang, code] = match;
					result += content.slice(lastIndex, match.index);

					try {
						const formatted = js_beautify(code, { indent_size: 2 });
						result += `\`\`\`${lang}\n${formatted.trim()}\n\`\`\``;
						changed = true;
					} catch (e: any) {
						new Notice(`Formatting failed for ${lang}: ${e.message}`);
						console.error(e);
						result += fullMatch; // fallback to original
					}
					lastIndex = match.index + fullMatch.length;
				}

				// Add the remainder of the file
				result += content.slice(lastIndex);

				if (changed) {
					await this.app.vault.modify(active, result);
					new Notice("Code blocks formatted successfully!");
				} else {
					new Notice("No code blocks were formatted.");
				}
			},
		});
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
