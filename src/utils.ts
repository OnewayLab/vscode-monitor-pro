export function removeSubscript(str: string): string {
	return str.replace(/\[\w*\]/g, "");
}