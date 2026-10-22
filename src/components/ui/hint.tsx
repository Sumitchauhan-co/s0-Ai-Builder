import type { ReactNode } from 'react';

export function Hint({
	text,
	children,
}: {
	text: string;
	side?: 'top' | 'right' | 'bottom' | 'left';
	align?: 'start' | 'center' | 'end';
	children: ReactNode;
}) {
	return (
		<span className="inline-flex" title={text}>
			{children}
		</span>
	);
}
