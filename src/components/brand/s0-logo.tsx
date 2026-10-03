import { cn } from '@/lib/utils';

/**
 * Props for {@link S0AiBuilderLogo}.
 *
 * @property className - Extra classes applied to the wrapper.
 * @property showWordmark - Whether to render the "s0-ai-builder" text next to the mark.
 */
type S0LogoProps = {
	className?: string;
	showWordmark?: boolean;
};

/**
 * The standalone s0-ai-builder glyph (SVG mark) without the wordmark.
 *
 * Inherits color via `currentColor` so it adapts to the surrounding text color.
 *
 * @param className - Extra classes applied to the `<svg>` element.
 */
function S0Mark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden
			className={cn('shrink-0', className)}
		>
			{/* Hexagonal Tech Outer Boundary */}
			<path
				d="M12 2L3 7v10l9 5 9-5V7L12 2z"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			{/* Core Microchip/Builder Block */}
			<rect
				x="9"
				y="9"
				width="6"
				height="6"
				rx="1.5"
				fill="currentColor"
				opacity="0.2"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			{/* Top and Bottom Node Accents */}
			<circle
				cx="12"
				cy="7"
				r="1"
				fill="currentColor"
			/>
			<circle
				cx="12"
				cy="17"
				r="1"
				fill="currentColor"
			/>
		</svg>
	);
}

/**
 * The s0-ai-builder brand logo: the glyph mark plus an optional "s0-ai-builder" wordmark.
 *
 * @param props - See {@link S0LogoProps}.
 */
export function S0Logo({ className, showWordmark = true }: S0LogoProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-2.5 text-foreground',
				className,
			)}
		>
			<S0Mark className="h-7 w-auto" />
			{showWordmark ? (
				<span className="text-base font-semibold tracking-tight">s0</span>
			) : null}
		</span>
	);
}

export { S0Mark };
