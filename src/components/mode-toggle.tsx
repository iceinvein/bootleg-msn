import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	ResponsiveDropdownMenu,
	ResponsiveDropdownMenuContent,
	ResponsiveDropdownMenuItem,
	ResponsiveDropdownMenuTrigger,
} from "@/components/ui/responsive-dropdown-menu";

export function ModeToggle() {
	const { setTheme } = useTheme();

	return (
		<ResponsiveDropdownMenu>
			<ResponsiveDropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<Sun className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</ResponsiveDropdownMenuTrigger>
			<ResponsiveDropdownMenuContent align="end" title="Theme">
				<ResponsiveDropdownMenuItem onClick={() => setTheme("light")}>
					<Sun className="mr-2 h-4 w-4" />
					Light
				</ResponsiveDropdownMenuItem>
				<ResponsiveDropdownMenuItem onClick={() => setTheme("dark")}>
					<Moon className="mr-2 h-4 w-4" />
					Dark
				</ResponsiveDropdownMenuItem>
				<ResponsiveDropdownMenuItem onClick={() => setTheme("system")}>
					<span className="mr-2 flex h-4 w-4 items-center justify-center">
						⚙️
					</span>
					System
				</ResponsiveDropdownMenuItem>
			</ResponsiveDropdownMenuContent>
		</ResponsiveDropdownMenu>
	);
}
