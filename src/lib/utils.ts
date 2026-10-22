export { cn } from 'cn';

export type TreeItem = string | [string, ...TreeItem[]];

type FileTreeNode = {
	files: string[];
	folders: Map<string, FileTreeNode>;
};

export function convertFilesToTreeItems(
	files: Record<string, string>,
): TreeItem[] {
	const root: FileTreeNode = { files: [], folders: new Map() };

	for (const path of Object.keys(files)) {
		const segments = path.split('/').filter(Boolean);
		if (segments.length === 0) continue;

		let node = root;
		for (const segment of segments.slice(0, -1)) {
			let child = node.folders.get(segment);
			if (!child) {
				child = { files: [], folders: new Map() };
				node.folders.set(segment, child);
			}
			node = child;
		}
		node.files.push(segments[segments.length - 1]);
	}

	function toItems(node: FileTreeNode): TreeItem[] {
		const folders: TreeItem[] = [...node.folders.entries()]
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([name, child]) => [name, ...toItems(child)]);
		const fileItems = node.files.sort((left, right) =>
			left.localeCompare(right),
		);
		return [...folders, ...fileItems];
	}

	return toItems(root);
}
