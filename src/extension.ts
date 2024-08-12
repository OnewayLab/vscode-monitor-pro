// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { workspace, ExtensionContext } from "vscode";
import { powerShellRelease, powerShellStart } from "systeminformation";
import { Configuration } from "./configuration";
import { MonitorStatusBarItem } from "./views";
import I18n from "./i18n";

let intervalIds: NodeJS.Timeout;
let statusBarItem: MonitorStatusBarItem;

export const activate = async (ctx: ExtensionContext) => {
	if (process.platform === "win32") {
		powerShellStart();
	}
	I18n.init(ctx.extensionPath);
	const config = new Configuration();
	statusBarItem = new MonitorStatusBarItem(config);
	const updateBarsText = () => statusBarItem.update();
	intervalIds = setInterval(updateBarsText, config.refreshInterval);
};

export const deactivate = () => {
	if (process.platform === "win32") {
		powerShellRelease();
	}
	clearInterval(intervalIds);
	statusBarItem.dispose();
};
