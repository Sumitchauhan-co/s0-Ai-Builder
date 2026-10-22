'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Code, CrownIcon, EyeIcon } from 'lucide-react';
import { Tabs } from '@base-ui/react/tabs';
import { Button } from '@/components/ui/button';
import {
	Group as ResizablePanelGroup,
	Panel as ResizablePanel,
	Separator as ResizableHandle,
} from 'react-resizable-panels';
import type { ProjectFragment } from '@/features/projects/fragment-types';
import ProjectHeader from './project-header';
import MessageContainer from './message-container';
import FragmentWeb from './fragment-web';
import { FileExplorer } from './file-explorer';

export function ProjectView({ projectId }: { projectId: string }) {
	const [activeFragment, setActiveFragment] = useState<ProjectFragment | null>(
		null,
	);
	const [tabState, setTabState] = useState<'preview' | 'code'>('preview');

	return (
		<div className="h-screen">
			<ResizablePanelGroup orientation="horizontal" className="h-full">
				<ResizablePanel
					defaultSize={28}
					minSize={20}
					className="flex min-h-0 flex-col"
				>
					<ProjectHeader projectId={projectId} />
					<MessageContainer
						projectId={projectId}
						activeFragment={activeFragment}
						setActiveFragment={setActiveFragment}
					/>
				</ResizablePanel>

				<ResizableHandle className="w-px bg-border transition-colors hover:bg-primary/40" />

				<ResizablePanel
					defaultSize={72}
					minSize={45}
					className="min-w-0"
				>
					<Tabs.Root
						className="flex h-full flex-col"
						value={tabState}
						onValueChange={(value) => {
							if (value === 'preview' || value === 'code') setTabState(value);
						}}
					>
						<div className="flex w-full items-center gap-x-2 border-b p-2">
							<Tabs.List className="flex h-8 rounded-md border p-0">
								<Tabs.Tab
									value="preview"
									className="flex items-center gap-x-2 rounded-md px-3"
								>
									<EyeIcon className="size-4" />
									<span>Demo</span>
								</Tabs.Tab>
								<Tabs.Tab
									value="code"
									className="flex items-center gap-x-2 rounded-md px-3"
								>
									<Code className="size-4" />
									<span>Code</span>
								</Tabs.Tab>
							</Tabs.List>

							<div className="ml-auto flex items-center gap-x-2">
								<Button
									size="sm"
									variant="outline"
									render={
										<Link href="/">
											<CrownIcon className="mr-2 size-4" />
											Upgrade
										</Link>
									}
								>
								</Button>
							</div>
						</div>

						<Tabs.Panel
							value="preview"
							className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
						>
							{activeFragment ? (
								<FragmentWeb data={activeFragment} />
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									Select a fragment to preview
								</div>
							)}
						</Tabs.Panel>

						<Tabs.Panel
							value="code"
							className="mt-0 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden"
						>
							{activeFragment?.files &&
							Object.keys(activeFragment.files).length > 0 ? (
								<FileExplorer files={activeFragment.files} />
							) : (
								<div className="flex h-full items-center justify-center text-muted-foreground">
									Select a fragment to view code
								</div>
							)}
						</Tabs.Panel>
					</Tabs.Root>
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
