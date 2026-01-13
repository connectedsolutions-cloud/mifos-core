# Coding Standards and Pre-Commit Guidelines

This document outlines general best practices for code structure, formatting, and organization to ensure smooth commits and maintain code quality.

## Table of Contents

1. [Code Formatting](#code-formatting)
2. [File Organization](#file-organization)
3. [Naming Conventions](#naming-conventions)
4. [Style Guidelines](#style-guidelines)
5. [Pre-Commit Best Practices](#pre-commit-best-practices)
6. [Common Issues and Solutions](#common-issues-and-solutions)

## Code Formatting

### General Principles

- **Consistency is Key**: Follow the project's established formatting rules consistently across all files
- **Use Automated Tools**: Rely on formatters (Prettier, Black, gofmt, etc.) rather than manual formatting
- **Format Before Committing**: Always format your code before committing to avoid pre-commit hook failures

### Best Practices

1. **Configure Your Editor**: Set up your IDE/editor to format on save using the project's formatter configuration
2. **Run Formatters Locally**: Before committing, run the project's formatting command to catch issues early
3. **Respect Project Standards**: Don't override formatter settings unless absolutely necessary
4. **Format All File Types**: Ensure formatters are configured for all relevant file types (code, styles, markup, config)

## File Organization

### Directory Structure

- **Follow Project Conventions**: Maintain consistency with the existing project structure
- **Group Related Files**: Keep related files together (components, services, utilities)
- **Separate Concerns**: Keep build artifacts, dependencies, and source code in separate directories
- **Use Clear Naming**: Directory names should clearly indicate their purpose

### File Naming

- **Consistent Case**: Use the project's naming convention (kebab-case, camelCase, PascalCase)
- **Descriptive Names**: File names should clearly indicate their content and purpose
- **Avoid Special Characters**: Use alphanumeric characters and standard separators only
- **Match Exports**: File names should match their primary export (for applicable languages)

## Naming Conventions

### Variables and Functions

- **Use Descriptive Names**: Names should clearly communicate purpose and intent
- **Follow Language Conventions**: Adhere to language-specific naming standards
- **Avoid Abbreviations**: Use full words unless abbreviations are widely understood
- **Consistent Style**: Maintain consistent naming style throughout the codebase

### Components and Classes

- **PascalCase for Classes**: Use PascalCase for class and component names
- **Clear Purpose**: Names should indicate the component's or class's responsibility
- **Avoid Generic Names**: Use specific, meaningful names rather than generic ones

## Style Guidelines

### Code Style

- **Indentation**: Use consistent indentation (spaces or tabs as per project standard)
- **Line Length**: Respect maximum line length limits set by the project
- **Whitespace**: Use appropriate whitespace for readability
- **Comments**: Write clear, concise comments that explain "why" not "what"

### Style Files (CSS/SCSS/LESS)

- **Organized Structure**: Group related styles together
- **Consistent Formatting**: Follow the same formatting rules as code files
- **Avoid Deep Nesting**: Keep selector nesting to a reasonable depth
- **Use Variables**: Leverage CSS variables or preprocessor variables for consistency

### Markup (HTML/JSX)

- **Proper Indentation**: Maintain consistent indentation levels
- **Attribute Formatting**: Format attributes consistently (single vs. double quotes, spacing)
- **Self-Closing Tags**: Use appropriate self-closing tag syntax
- **Accessibility**: Include proper semantic HTML and accessibility attributes

## Pre-Commit Best Practices

### Before Committing

1. **Run Linters Locally**: Execute linting commands before committing to catch issues early
2. **Format Your Code**: Run formatters on all modified files
3. **Check for Errors**: Ensure there are no syntax errors or type errors
4. **Test Your Changes**: Verify that your changes work as expected
5. **Review Staged Files**: Check what files are staged to avoid committing unintended changes

### Understanding Pre-Commit Hooks

- **What They Do**: Pre-commit hooks automatically run checks (linting, formatting, tests) before allowing commits
- **Why They Exist**: They ensure code quality and consistency across the project
- **How to Handle Failures**: Fix the issues reported by the hooks rather than bypassing them

### Common Pre-Commit Checks

- **Code Formatting**: Ensures code follows formatting standards
- **Linting**: Checks for code quality issues and potential bugs
- **Style Checking**: Validates CSS/SCSS formatting and best practices
- **Type Checking**: Verifies type safety (for typed languages)
- **Tests**: Runs relevant tests to ensure nothing is broken

## Common Issues and Solutions

### Formatting Issues

**Problem**: Pre-commit hook fails due to formatting inconsistencies

**Solution**:

- Run the project's formatter command (e.g., `prettier --write`, `black .`, `gofmt -w`)
- Configure your editor to format on save
- Check the project's formatting configuration file for rules

### Linting Errors

**Problem**: Linter reports errors or warnings

**Solution**:

- Fix the reported issues according to the linter's suggestions
- Review the project's linting configuration to understand the rules
- Run the linter locally before committing: `npm run lint` or equivalent

### Build Artifacts

**Problem**: Pre-commit hooks try to lint build artifacts or generated files

**Solution**:

- Ensure build directories are properly ignored in linting configuration
- Don't commit build artifacts or generated files
- Update `.gitignore` to exclude build directories
- Configure linters to ignore build and cache directories

### Timeout Issues

**Problem**: Pre-commit hooks timeout or take too long

**Solution**:

- Only stage files you've actually modified
- Ensure linting configuration excludes unnecessary directories
- Use linting cache when available
- Consider running checks on staged files only (not entire codebase)

### Configuration Conflicts

**Problem**: Personal editor settings conflict with project standards

**Solution**:

- Use project-specific editor configuration files (`.editorconfig`, workspace settings)
- Override personal preferences to match project standards
- Use project's formatter configuration rather than default editor settings

## General Guidelines

### Code Quality

- **Write Clean Code**: Focus on readability and maintainability
- **Follow SOLID Principles**: Apply appropriate design principles
- **Keep Functions Small**: Write focused, single-purpose functions
- **Avoid Code Duplication**: Refactor common patterns into reusable code

### Version Control

- **Small, Focused Commits**: Make commits that represent logical, complete changes
- **Clear Commit Messages**: Write descriptive commit messages
- **Don't Skip Hooks**: Don't bypass pre-commit hooks with `--no-verify` unless absolutely necessary
- **Review Before Committing**: Review your changes before staging and committing

### Team Collaboration

- **Respect Project Standards**: Follow the team's established conventions
- **Ask Questions**: When in doubt about formatting or structure, ask the team
- **Update Documentation**: Keep documentation updated when standards change
- **Share Knowledge**: Help team members understand and follow standards

## Quick Checklist

Before committing, ensure:

- [ ] Code is properly formatted
- [ ] Linter passes without errors
- [ ] No build artifacts are staged
- [ ] Tests pass (if applicable)
- [ ] Code follows project naming conventions
- [ ] Files are organized according to project structure
- [ ] No unnecessary files are staged
- [ ] Commit message is clear and descriptive

## Additional Resources

- Review the project's `.prettierrc`, `.eslintrc`, or equivalent configuration files
- Check the project's `package.json` or build configuration for available scripts
- Consult the project's main README for project-specific guidelines
- Refer to framework or language-specific style guides when applicable

---

**Remember**: The goal of these standards is to maintain code quality and consistency. When in doubt, follow the project's existing patterns and conventions.
