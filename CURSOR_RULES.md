# Cursor Rules and Best Practices

## General Guidelines

1. **Code Organization**
   - Keep related files in appropriate directories
   - Use meaningful file and directory names
   - Maintain consistent file structure across projects
   - Group related components together

2. **File Management**
   - Create new files for new features or components
   - Delete unused files to maintain cleanliness
   - Use appropriate file extensions
   - Keep files focused on a single responsibility

3. **Code Quality**
   - Write clean, readable code
   - Follow language-specific best practices
   - Use consistent formatting
   - Add appropriate comments and documentation
   - Handle errors gracefully

4. **Version Control**
   - Make atomic commits
   - Write clear commit messages
   - Keep commits focused on a single change
   - Use branches for feature development

## AI Assistant Guidelines

1. **Communication**
   - Be specific in your requests
   - Provide context when needed
   - Ask for clarification when unsure
   - Use clear and concise language

2. **Code Generation**
   - Specify requirements clearly
   - Review generated code before accepting
   - Test code thoroughly
   - Request modifications when needed

3. **Debugging**
   - Provide error messages
   - Share relevant code snippets
   - Explain the expected behavior
   - Describe steps to reproduce issues

4. **Learning**
   - Ask for explanations of complex concepts
   - Request code examples
   - Seek best practice recommendations
   - Learn from provided solutions

## Project Structure

```
project/
├── src/                    # Source code
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── utils/             # Utility functions
│   └── styles/            # CSS/SCSS files
├── public/                # Static assets
├── tests/                 # Test files
├── docs/                  # Documentation
└── config/                # Configuration files
```

## Best Practices

1. **Code Style**
   - Use consistent indentation
   - Follow naming conventions
   - Write self-documenting code
   - Keep functions small and focused

2. **Performance**
   - Optimize critical paths
   - Minimize unnecessary re-renders
   - Use appropriate data structures
   - Implement caching when beneficial

3. **Security**
   - Never commit sensitive information
   - Validate user input
   - Use secure authentication methods
   - Keep dependencies updated

4. **Testing**
   - Write unit tests for critical functionality
   - Test edge cases
   - Maintain test coverage
   - Automate testing when possible

## Common Commands

```bash
# Create new file
cursor new <filename>

# Search codebase
cursor search <query>

# Edit file
cursor edit <filename>

# Run tests
cursor test

# Build project
cursor build
```

## Troubleshooting

1. **Common Issues**
   - Check file permissions
   - Verify file paths
   - Ensure dependencies are installed
   - Check for syntax errors

2. **Getting Help**
   - Use the help command
   - Check documentation
   - Search for similar issues
   - Ask for assistance

Remember to adapt these rules to your specific project needs and team requirements. Regular review and updates of these guidelines are recommended. 