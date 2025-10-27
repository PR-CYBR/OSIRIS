# Contributing to OSIRIS

Thank you for your interest in contributing to OSIRIS! This document provides guidelines and instructions for contributing to the project.

## Development Philosophy

OSIRIS follows a **specification-driven development** approach using the [Spec-Kit framework](https://github.com/PR-CYBR/spec-bootstrap):

1. **Specify First**: All changes begin with updating specifications in `.specify/`
2. **Plan**: Break down work into discrete tasks
3. **Implement**: Write code that implements the specifications
4. **Test**: Validate against spec requirements
5. **Document**: Keep documentation in sync with code

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git
- A GitHub account

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/OSIRIS.git
   cd OSIRIS
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run tests to verify setup:
   ```bash
   npm test
   ```

## Development Workflow

### 1. Check Specifications

Before making changes:

- Review [constitution](.specify/constitution.md) for project principles
- Check [spec](.specify/spec.md) for technical requirements
- Read [plan](.specify/plan.md) for implementation roadmap

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 3. Make Changes

- Write clean, well-documented code
- Follow existing code style (enforced by ESLint)
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run build
npm run build
```

### 5. Commit Changes

Follow conventional commit format:

```bash
git commit -m "type(scope): description"
```

Types:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test additions/updates
- `chore` - Maintenance tasks

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Standards

### JavaScript Style

- Use ES6+ features
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused

### Testing

- Write unit tests for new functions
- Maintain or improve code coverage
- Test edge cases and error conditions
- Use descriptive test names

### Documentation

- Update README if adding user-facing features
- Update module README files
- Add JSDoc comments to code
- Update specs if changing architecture

## Module Development

Each module follows a standard structure:

```
modules/MODULE_NAME/
├── src/
│   └── index.js      # Main module code
├── tests/
│   └── index.test.js # Module tests
└── README.md         # Module documentation
```

### Adding a New Module

1. Update `.specify/spec.md` with module specifications
2. Update `.specify/plan.md` with implementation tasks
3. Create module directory structure
4. Implement module with tests
5. Add module README
6. Update main README

## Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Request review from maintainers
4. Address review feedback
5. Wait for approval and merge

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] Specifications updated if needed
- [ ] No linting errors
- [ ] Build succeeds

## CI/CD Pipeline

OSIRIS uses GitHub Actions for continuous integration:

- **main** - Integration branch for completed features
- **test** - Automated testing environment
- **stage** - Pre-production validation
- **prod** - Production environment
- **pages** - Public status page

PRs are automatically tested. Merges to main trigger the promotion pipeline.

## Issue Reporting

### Bug Reports

Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error messages/logs

### Feature Requests

Include:

- Clear description of the feature
- Use case and motivation
- Proposed implementation (if any)
- Impact on existing functionality

## Questions and Support

- Open an issue for questions
- Check existing issues first
- Be respectful and constructive
- Provide context and details

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Assume good intentions
- Help maintain a positive community

## License

By contributing to OSIRIS, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Your contributions help make OSIRIS better for everyone. We appreciate your time and effort!
