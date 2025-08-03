---
inclusion: fileMatch
fileMatchPattern: 'src/components/*'
---

# React Component Development Rules

## Component Structure

- Use functional components with TypeScript interfaces for props
- Keep components focused on a single responsibility
- Extract complex logic into custom hooks
- Use proper prop validation with TypeScript

## MSN Messenger UI Guidelines

- Maintain consistent spacing using Tailwind classes
- Use the established color palette (blue/purple theme)
- Ensure components are responsive and accessible
- Follow the nostalgic MSN Messenger design patterns

## State Management

- Use local state for component-specific data
- Use Convex queries for server state
- Avoid prop drilling - use context when needed
- Keep state as close to where it's used as possible

## Accessibility

- Add proper ARIA labels for interactive elements
- Ensure keyboard navigation works correctly
- Use semantic HTML elements
- Provide alternative text for images and icons
