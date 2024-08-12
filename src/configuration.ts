import { workspace } from "vscode";
import { Metrics } from "./metrics";
import { removeSubscript } from "./utils";

export class Configuration {
	get refreshInterval() {
		return workspace.getConfiguration().get<number>("monitor-pro.refresh-interval") ?? 1000;
	}
	get metrics() {
		return workspace.getConfiguration().get<string>("monitor-pro.metrics") ?? "";
	}
	get precision() {
		return workspace.getConfiguration().get<number>("monitor-pro.precision") ?? 2;
	}
	get requiredMetrics() {
		return (
			removeSubscript(this.metrics)
				.match(/{[^}]+}/g)
				?.map((metric) => metric.slice(1, -1))
				?.filter((metric) => Metrics.availableMetrics.includes(metric)) ?? []
		);
	}
}
