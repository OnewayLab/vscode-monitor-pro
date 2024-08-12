import * as vscode from "vscode";
import { Metrics } from "./metrics";
import i18n from "./i18n";
import { Configuration } from "./configuration";
import { removeSubscript } from "./utils";

export class MonitorStatusBarItem {
	private readonly config: Configuration;
	private readonly bar: vscode.StatusBarItem;

	constructor(config: Configuration) {
		this.config = config;
		this.bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	}

	async update() {
		const metrics = await Metrics.getMetrics(this.config.requiredMetrics);
		this.bar.text = this.getStatusBarText(metrics);
		this.bar.show();
	}

	dispose() {
		this.bar?.dispose();
	}

	private getStatusBarText(metrics: Metrics): string {
		let text = this.config.metrics;

		// Unfold arrays
		const arrays = text.match(/\[.*\]/g)?.map((match) => match[0]) ?? [];
		for (let array of arrays) {
			array = array.slice(1, -1);
			const metricNames =
				removeSubscript(array)
					.match(/{[^}]+}/g)
					?.map((metric) => metric.slice(1, -1))
					?.filter((metric) => Metrics.availableMetrics.includes(metric)) ?? [];
			const nElements = Math.max(
				...metricNames.map((metricName) => {
					const metric = eval(`metrics.${metricName}`);
					return metric instanceof Array ? metric.length : 1;
				})
			);
			let unfoldedArray = "";
			for (let i = 0; i < nElements; i++) {
				unfoldedArray += array.replace(/\[n\]/g, `[${i}]`).replace(/\{n\}/g, `{${i}}`);
			}
			text = text.replace(array, unfoldedArray);
		}

		// Replace metrics
		const precision = this.config.precision;
		text = text.replace(/{[^}]+}/g, (match) => metrics.getMetricString(match.slice(1, -1), precision));

		return text;
	}
}
