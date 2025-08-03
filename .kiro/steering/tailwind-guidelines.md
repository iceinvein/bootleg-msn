# Tailwind CSS Guidelines for MSN Messenger

## Core Principles

### Utility-First Approach

- Use Tailwind utility classes instead of custom CSS whenever possible
- Prefer composition of utilities over creating custom components
- Keep styles co-located with components for better maintainability

### MSN Messenger Theme Colors

- **Primary Blue**: `bg-blue-500`, `bg-blue-600`, `text-blue-500`
- **Secondary Green**: `bg-green-500`, `bg-green-600` (for group chats)
- **Purple Accent**: `bg-purple-500`, `bg-purple-600` (for special actions)
- **Status Colors**:
  - Online: `text-green-500` 🟢
  - Away: `text-yellow-500` 🟡
  - Busy: `text-red-500` 🔴
  - Offline: `text-gray-400` ⚪

## Layout Patterns

### Flexbox Usage

```css
/* Chat containers */
flex h-full flex-col bg-white

/* Message alignment */
flex justify-end (for sent messages)
flex justify-start (for received messages)

/* Header layouts */
flex items-center justify-between
```

### Grid Systems

- Use CSS Grid for complex layouts: `grid grid-cols-[280px_1fr]`
- Prefer flexbox for simpler one-dimensional layouts
- Use `space-x-*` and `space-y-*` for consistent spacing

### Responsive Design

- Mobile-first approach with `sm:`, `md:`, `lg:`, `xl:` prefixes
- Message bubbles: `max-w-xs lg:max-w-md`
- Sidebar: `w-80` (fixed width for consistency)

## Component Styling Patterns

### Message Bubbles

```css
/* Sent messages */
rounded-lg px-3 py-2 bg-blue-500 text-white

/* Received messages */
rounded-lg px-3 py-2 border border-gray-200 bg-white text-gray-800

/* Deleted messages */
rounded-lg px-3 py-2 bg-gray-100 text-gray-500 italic

/* Emoji-only messages */
bg-transparent p-0 text-3xl
```

### Interactive Elements

```css
/* Buttons */
rounded-md bg-blue-500 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-gray-300

/* Three-dot menu */
rounded-full p-1 opacity-0 transition-opacity hover:bg-black hover:bg-opacity-10 group-hover:opacity-100

/* Dropdown menus */
absolute top-8 right-2 z-50 min-w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg
```

### Form Elements

```css
/* Text inputs */
w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500

/* Textareas */
w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
```

## Animation and Transitions

### Hover Effects

- Use `transition-colors` for color changes
- Use `transition-opacity` for fade effects
- Use `hover:` prefix for interactive states

### Group Hover

- Use `group` class on parent and `group-hover:` on children
- Perfect for message bubbles with three-dot menus

### Focus States

- Always include focus states for accessibility
- Use `focus:ring-2 focus:ring-blue-500` for form elements
- Use `focus:outline-none` to remove default browser outlines

## Spacing and Sizing

### Consistent Spacing Scale

- `space-x-2`, `space-x-3` for small gaps
- `p-4` for standard padding
- `mb-2`, `mt-1` for message spacing
- `gap-4` for grid layouts

### Text Sizing

- `text-xs` for timestamps and metadata
- `text-sm` for secondary text
- `text-base` for message content (default)
- `text-lg`, `text-xl` for headers

### Border Radius

- `rounded-full` for avatars and circular buttons
- `rounded-lg` for message bubbles
- `rounded-md` for form elements and dropdowns

## Accessibility Considerations

### Color Contrast

- Ensure sufficient contrast ratios
- Use `text-gray-500` for secondary text
- Use `text-gray-900` for primary text

### Focus Indicators

- Always include visible focus states
- Use `focus:ring-*` utilities
- Test keyboard navigation

### Screen Reader Support

- Use semantic HTML with Tailwind classes
- Don't rely solely on color for meaning
- Include proper ARIA labels

## CN Function Usage

### Import and Basic Usage

```tsx
import { cn } from "@/lib/utils";

// Basic usage - combines clsx and tailwind-merge
className={cn("base-class", conditionalClass && "conditional-class")}
```

### Benefits of CN Function

- **Deduplication**: Automatically removes duplicate Tailwind classes
- **Conflict Resolution**: Later classes override earlier conflicting ones
- **Type Safety**: Better TypeScript support than string templates
- **Readability**: Cleaner conditional logic
- **Performance**: Optimized class merging

### Common Patterns

```tsx
// Boolean conditions
className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)}

// Object-based conditions (recommended for multiple conditions)
className={cn(
  "base-classes",
  {
    "active-classes": isActive,
    "disabled-classes": isDisabled,
    "error-classes": hasError,
  }
)}

// Ternary conditions
className={cn(
  "base-classes",
  isFromMe ? "sent-message-classes" : "received-message-classes"
)}

// Array of classes
className={cn([
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
])}
```

## Performance Best Practices

### Class Organization

```css
/* Group related utilities */
flex items-center space-x-3 (layout)
rounded-lg px-3 py-2 (appearance)
bg-blue-500 text-white (colors)
transition-colors hover:bg-blue-600 (interactions)
```

### Avoid Arbitrary Values

- Use design tokens: `w-80` instead of `w-[320px]`
- Stick to the spacing scale: `p-4` instead of `p-[16px]`
- Use semantic colors: `bg-blue-500` instead of `bg-[#3b82f6]`

### Conditional Classes

```tsx
import { cn } from "@/lib/utils";

// Use cn function for conditional classes
className={cn(
  "rounded-lg px-3 py-2",
  isFromMe 
    ? "bg-blue-500 text-white" 
    : "border border-gray-200 bg-white text-gray-800"
)}

// For complex conditions
className={cn(
  "rounded-lg px-3 py-2", // base classes
  {
    "bg-blue-500 text-white": isFromMe,
    "border border-gray-200 bg-white text-gray-800": !isFromMe,
    "opacity-50": isDeleted,
    "bg-transparent p-0 text-3xl": isEmojiOnly,
  }
)}
```

## Common Patterns

### Gradient Backgrounds

```css
bg-gradient-to-r from-blue-500 to-blue-600 (headers)
bg-gradient-to-b from-blue-50 to-white (message areas)
bg-gradient-to-br from-gray-400 to-gray-600 (avatars)
```

### Shadow Usage

```css
shadow-lg (dropdowns and modals)
shadow-md (elevated cards)
shadow-sm (subtle elevation)
```

### Z-Index Management

```css
z-50 (dropdowns and modals)
z-40 (overlays)
z-10 (elevated content)
```

## Anti-Patterns to Avoid

### Don't Use

- String templates for conditional classes: `` `base ${condition ? 'class' : ''}` ``
- Inline styles instead of Tailwind classes
- Custom CSS for things Tailwind can handle
- Inconsistent spacing (mixing `p-3` and `p-4` randomly)
- Hard-coded colors outside the design system
- Manual class concatenation without conflict resolution

### Instead Use

- `cn()` function for all conditional class logic
- Tailwind utilities for all styling
- Design tokens from the established scale
- Consistent patterns across components
- Semantic color names
- Object-based conditional classes for better readability

## File Organization

### Component-Level Styling

- Keep all Tailwind classes in the component file
- Use template literals for complex conditional classes
- Extract repeated patterns into reusable class strings

### Shared Patterns

```tsx
import { cn } from "@/lib/utils";

// Define common class combinations
const messageBaseClasses = "rounded-lg px-3 py-2";
const buttonBaseClasses = "rounded-md px-6 py-2 font-medium transition-colors";

// Use cn function for combining classes
const getMessageClasses = (isFromMe: boolean, isDeleted: boolean) => cn(
  messageBaseClasses,
  {
    "bg-blue-500 text-white": isFromMe && !isDeleted,
    "border border-gray-200 bg-white text-gray-800": !isFromMe && !isDeleted,
    "bg-gray-100 text-gray-500 italic": isDeleted,
  }
);

// For button variants
const getButtonClasses = (variant: "primary" | "secondary" | "danger") => cn(
  buttonBaseClasses,
  {
    "bg-blue-500 hover:bg-blue-600 text-white": variant === "primary",
    "bg-gray-200 hover:bg-gray-300 text-gray-800": variant === "secondary", 
    "bg-red-500 hover:bg-red-600 text-white": variant === "danger",
  }
);
```

## MSN Messenger Specific Examples

### Message Bubble Classes

```tsx
import { cn } from "@/lib/utils";

// Message bubble with all conditions
const getMessageBubbleClasses = (
  isFromMe: boolean, 
  isDeleted: boolean, 
  isEmojiOnly: boolean,
  messageType: string
) => cn(
  "group relative",
  {
    // Base message bubble
    "rounded-lg px-3 py-2": !isEmojiOnly,
    "bg-transparent p-0 text-3xl": isEmojiOnly,
    
    // Message states
    "bg-blue-500 text-white": isFromMe && !isDeleted && !isEmojiOnly,
    "border border-gray-200 bg-white text-gray-800": !isFromMe && !isDeleted && !isEmojiOnly,
    "bg-gray-100 text-gray-500 italic": isDeleted,
  }
);
```

### Three-Dot Menu Button

```tsx
const getMenuButtonClasses = (isFromMe: boolean) => cn(
  "absolute top-2 rounded-full p-1 opacity-0 transition-opacity",
  "hover:bg-black hover:bg-opacity-10 group-hover:opacity-100",
  {
    "left-2": isFromMe,
    "right-2": !isFromMe,
  }
);
```

### Status Indicator Classes

```tsx
const getStatusClasses = (status: string) => cn(
  "text-xs",
  {
    "text-green-500": status === "online",
    "text-yellow-500": status === "away", 
    "text-red-500": status === "busy",
    "text-gray-400": status === "offline",
  }
);
```

### Form Input Classes

```tsx
const getInputClasses = (hasError: boolean, theme: "blue" | "green" = "blue") => cn(
  "w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-1",
  {
    // Normal state
    "border-gray-300": !hasError,
    "focus:border-blue-500 focus:ring-blue-500": !hasError && theme === "blue",
    "focus:border-green-500 focus:ring-green-500": !hasError && theme === "green",
    
    // Error state
    "border-red-300": hasError,
    "focus:border-red-500 focus:ring-red-500": hasError,
  }
);
```

This approach ensures consistent styling across the MSN Messenger application while maintaining the nostalgic feel and modern functionality. The `cn` function provides better maintainability, type safety, and automatic conflict resolution for Tailwind classes.
