# AI Chat Rules for MSN Messenger Project

## Code Quality Standards

- Always use TypeScript strict mode
- Prefer functional components with hooks over class components
- Use proper error handling with try-catch blocks
- Follow the existing naming conventions (camelCase for functions, PascalCase for components)
- Add proper type definitions instead of using `any`

## MSN Messenger Specific Guidelines

- Maintain the nostalgic MSN Messenger theme and UX patterns
- Use the established color scheme (blue/purple gradients)
- Keep the real-time messaging functionality as the core focus
- Ensure all new features work with both direct messages and group chats
- Maintain compatibility with the existing Convex schema

## Security Considerations

- Always validate user authentication before database operations
- Check user permissions for group operations
- Sanitize user inputs, especially for file uploads
- Use proper error messages that don't leak sensitive information

## Performance Guidelines

- Use Convex queries efficiently with proper indexing
- Implement pagination for large data sets
- Optimize real-time subscriptions to avoid unnecessary re-renders
- Use React.memo and useMemo for expensive computations

## Testing Approach

- Test both authenticated and unauthenticated states
- Verify real-time functionality works correctly
- Test file upload/download functionality
- Ensure proper error handling for network failures
