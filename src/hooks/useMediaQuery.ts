import { useEffect, useState } from "react";

/**
 * Custom hook to track media query matches
 * @param query - The media query string to match
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState<boolean>(false);

	useEffect(() => {
		// Check if we're in a browser environment
		if (typeof window === "undefined") {
			return;
		}

		const mediaQuery = window.matchMedia(query);

		// Set initial value
		setMatches(mediaQuery.matches);

		// Create event listener function
		const handleChange = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		// Add listener
		mediaQuery.addEventListener("change", handleChange);

		// Cleanup function
		return () => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, [query]);

	return matches;
}
