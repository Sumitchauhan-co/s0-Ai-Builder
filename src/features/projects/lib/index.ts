export function getProjectThumbnailUrl(seed: string) {
	return `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=000000,ffffff&color=000000,ffffff`;
}
