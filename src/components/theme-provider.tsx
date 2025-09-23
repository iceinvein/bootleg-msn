import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "vite-ui-theme",
	...props
}: ThemeProviderProps) {
	const [theme, _setTheme] = useState<Theme>(() => {
		try {
			return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
		} catch (error) {
			console.error("Failed to read theme from localStorage:", error);
			return defaultTheme;
		}
	});

	// Compute the effective theme (resolves "system" to light/dark)
	const effectiveTheme = useMemo<Exclude<Theme, "system">>(() => {
		if (typeof window === "undefined") return "light";
		if (theme === "system") {
			return window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}
		return theme;
	}, [theme]);

	// Apply theme before paint to avoid visual lag
	useLayoutEffect(() => {
		const root = window.document.documentElement;
		// Clear both classes to avoid accumulation
		root.classList.remove("light", "dark");
		document.body.classList.remove("light", "dark");
		root.classList.add(effectiveTheme);
		document.body.classList.add(effectiveTheme);
		// Keep a data attribute for any CSS selectors that prefer attributes
		root.setAttribute("data-theme", effectiveTheme);
		document.body.setAttribute("data-theme", effectiveTheme);
		// Hint to the UA for native control theming and force recalculation
		root.style.colorScheme = effectiveTheme;
		document.body.style.colorScheme = effectiveTheme;
		// Bump a tick to force repaint in some browsers with backdrop-filter
		root.style.setProperty("--theme-tick", String(Date.now()));
		document.body.style.setProperty("--theme-tick", String(Date.now()));
	}, [effectiveTheme]);

	// Update when system theme changes while in "system" mode
	useEffect(() => {
		if (theme !== "system") return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = () => {
			// Trigger re-evaluation of effectiveTheme by updating a state noop
			// We toggle between "system" twice to re-run the memo without changing storage
			_setTheme((prev) => prev);
		};
		mql.addEventListener?.("change", handler);
		return () => mql.removeEventListener?.("change", handler);
	}, [theme]);

	const value = useMemo(
		() => ({
			theme,
			setTheme: (next: Theme) => {
				try {
					localStorage.setItem(storageKey, next);
				} catch (error) {
					console.error("Failed to save theme to localStorage:", error);
				}
				_setTheme(next);
			},
		}),
		[theme, storageKey],
	);

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
