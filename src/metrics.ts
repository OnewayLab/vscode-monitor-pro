import * as SI from "systeminformation";
import byteFormat from "./byteFormat";
import { removeSubscript } from "./utils";

export class Metrics {
	private static readonly metricMap: { [key: string]: [string, string, string] } = {
		"cpu.usage": ["currentLoad", "currentLoad", "%"],
		"cpu.speed": ["cpuCurrentSpeed", "avg", "GHz"],
		"cpu.temperature": ["cpuTemperature", "main", "°C"],
		"memory.total": ["mem", "total", "B"],
		"memory.used": ["mem", "used", "B"],
		"memory.active": ["mem", "active", "B"],
		"gpu.usage": ["graphics", "controllers", "%"],
		"gpu.temperature": ["graphics", "controllers", "°C"],
		"gpu.memory.total": ["graphics", "controllers", "B"],
		"gpu.memory.used": ["graphics", "controllers", "B"],
		"disk.read": ["fsStats", "rx_sec", "B/s"],
		"disk.write": ["fsStats", "wx_sec", "B/s"],
		"network.upload": ["networkStats", "tx_sec", "B/s"],
		"network.download": ["networkStats", "rx_sec", "B/s"],
		"battery.hasBattery": ["battery", "hasBattery", "(Battery)"],
		"battery.percent": ["battery", "percent", "%"],
		"battery.isCharging": ["battery", "isCharging", "(Charging)"],
		"os.distro": ["osInfo", "distro", ""],
	};
	public static readonly availableMetrics: string[] = Object.keys(this.metricMap);

	static async getMetrics(requiredMetrics: string[] = []): Promise<Metrics> {
		const valueObject: { [key: string]: string } = {};
		for (const metric of requiredMetrics) {
			const existedAttributes = valueObject[this.metricMap[metric][0]] ?? "";
			if (!existedAttributes.includes(this.metricMap[metric][1])) {
				valueObject[this.metricMap[metric][0]] = existedAttributes + "," + this.metricMap[metric][1];
			}
		}
		const values = await SI.get(valueObject);
		return new Metrics(values);
	}

	cpu: { usage: number; speed: number; temperature: number };
	memory: { total: number; used: number; active: number };
	gpu: { usage: number; temperature: number; memoryTotal: number; memoryUsed: number }[];
	disk: { read: number; write: number };
	network: { upload: number; download: number }[];
	battery: { hasBattery: boolean; percent: number; isCharging: boolean };
	os: { distro: string };

	getMetricString(metric: string, precision: number): string {
		const value = eval(`this.${metric}`);
		metric = removeSubscript(metric);
		if (typeof value === "string") {
			return value;
		} else if (typeof value === "number") {
			if (Metrics.metricMap[metric][2].startsWith("B")) {
				return Metrics.pretty(value, {
					minimumSignificantDigits: precision,
					maximumSignificantDigits: precision,
				});
			} else {
				return value.toPrecision(precision) + Metrics.metricMap[metric][2];
			}
		} else if (typeof value === "boolean") {
			return value ? Metrics.metricMap[metric][2] : "";
		} else {
			return "";
		}
	}

	private constructor(values: any) {
		this.cpu = {
			usage: values?.currentLoad?.currentLoad ?? 0,
			speed: values?.cpuCurrentSpeed?.avg ?? 0,
			temperature: values?.cpuTemperature?.main ?? 0,
		};
		this.memory = {
			total: values?.mem?.total ?? 0,
			used: values?.mem?.used ?? 0,
			active: values?.mem?.active ?? 0,
		};
		this.gpu = values?.graphics?.controllers?.map((c: any) => ({
			usage: c?.utilizationGPU ?? 0,
			temperature: c?.temperatureGPU ?? 0,
			memoryTotal: c?.memoryTotal ?? 0,
			memoryUsed: c?.memoryUsed ?? 0,
		}));
		this.disk = { read: values?.fsStats?.rx_sec ?? 0, write: values?.fsStats?.wx_sec ?? 0 };
		this.network = values?.networkStats?.map((n: any) => ({ upload: n?.tx_sec ?? 0, download: n?.rx_sec ?? 0 }));
		this.battery = {
			hasBattery: values?.battery?.hasBattery ?? false,
			percent: values?.battery?.percent ?? 0,
			isCharging: values?.battery?.isCharging ?? false,
		};
		this.os = { distro: values?.osInfo?.distro ?? "" };
	}

	/**
	 * Converts a byte value into a nicely formatted string.
	 * @param bytes The number of bytes to format.
	 * @param option An optional options object to customize formatting behavior. By default, it uses binary units, no space,
	 * a single unit suffix, and sets the minimum and maximum significant digits to 1 and 4. This object can override these defaults.
	 * @returns The formatted byte size as a string.
	 */
	private static pretty(bytes: number, option: any = {}): string {
		return byteFormat(bytes, {
			binary: true, // Use binary units
			space: false, // Do not add a space before the unit
			single: true, // Use a single unit, e.g., don't display both KB and MB
			minimumFractionDigits: 1, // Minimum fraction digits
			minimumIntegerDigits: 1, // Minimum integer digits
			minimumSignificantDigits: 4, // Minimum significant digits
			maximumSignificantDigits: 4, // Maximum significant digits
			...option, // Override default options with user-provided ones
		});
	}
}
