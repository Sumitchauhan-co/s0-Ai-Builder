import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Breadcrumb({
	className,
	...props
}: HTMLAttributes<HTMLElement>) {
	return (
		<nav aria-label="Breadcrumb" className={className} {...props} />
	);
}

export function BreadcrumbList({
	className,
	...props
}: HTMLAttributes<HTMLOListElement>) {
	return (
		<ol
			className={cn('flex min-w-0 items-center gap-1.5 text-sm', className)}
			{...props}
		/>
	);
}

export function BreadcrumbItem({
	className,
	...props
}: HTMLAttributes<HTMLLIElement>) {
	return <li className={cn('inline-flex min-w-0 items-center', className)} {...props} />;
}

export function BreadcrumbPage({
	className,
	...props
}: HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			aria-current="page"
			className={cn('truncate font-medium', className)}
			{...props}
		/>
	);
}

export function BreadcrumbSeparator({
	className,
	...props
}: HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			aria-hidden="true"
			className={cn('text-muted-foreground', className)}
			{...props}
		>
			/
		</span>
	);
}

export function BreadcrumbEllipsis({
	className,
	...props
}: HTMLAttributes<HTMLSpanElement>) {
	return (
		<span
			aria-label="More path segments"
			className={cn('text-muted-foreground', className)}
			{...props}
		>
			…
		</span>
	);
}
