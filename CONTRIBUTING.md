# Contributing to Deep Space Empire

## Development Workflow

### Branch Strategy
```
main          - Production-ready code
├─ develop    - Integration branch for features
├─ feature/*  - New features (feature/ship-fitting)
├─ bugfix/*   - Bug fixes (bugfix/market-crash)
├─ hotfix/*   - Critical production fixes
└─ release/*  - Release preparation branches
```

### Getting Started
1. **Clone the repository**
   ```bash
   git clone https://github.com/PandragonsLab/deep-space-empire.git
   cd deep-space-empire
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Code Standards

#### JavaScript/Node.js
- **ES6+ syntax** preferred
- **Consistent naming**: camelCase for variables, PascalCase for classes
- **File organization**: Group related functionality
- **Comments**: Document complex algorithms and business logic
- **Error handling**: Always handle promises and async operations

#### Git Commit Messages
```
feat: add ship fitting system
fix: resolve market data race condition
docs: update API documentation
refactor: reorganize universe generation
test: add unit tests for economic systems
```

### Project Structure
```
/deep-space-empire
├─ src/
│  ├─ game/              # Core game logic
│  ├─ server/            # Server-side systems
│  ├─ client/            # Client-side interface
│  ├─ shared/            # Shared utilities
│  └─ database/          # Data persistence
├─ tests/                # Test suites
├─ docs/                 # Documentation
├─ config/               # Configuration files
└─ scripts/              # Build and deployment scripts
```

### Feature Development Process

1. **Create Issue**: Describe the feature/bug with acceptance criteria
2. **Branch**: Create feature branch from `develop`
3. **Develop**: Implement with tests
4. **Test**: Ensure all tests pass
5. **PR**: Create pull request to `develop`
6. **Review**: Code review and approval
7. **Merge**: Squash and merge to `develop`

### Testing Requirements
- **Unit tests** for all core game mechanics
- **Integration tests** for client-server communication
- **Load tests** for MMO systems (1000+ concurrent users)
- **Code coverage** minimum 80%

### Performance Guidelines
- **Real-time constraints**: Server ticks must complete within 50ms
- **Memory management**: Monitor for memory leaks in long-running processes
- **Database optimization**: Index all frequently queried fields
- **Network efficiency**: Minimize data transferred per update

### Security Considerations
- **Input validation** on all client data
- **Authentication** for all player actions
- **Rate limiting** to prevent abuse
- **Cheating prevention** through server-side validation

### MMO-Specific Guidelines

#### Scalability
- **Stateless services** where possible
- **Horizontal scaling** for game servers
- **Database sharding** for player data
- **Caching strategies** for frequently accessed data

#### Game Balance
- **Economic modeling** before implementing new systems
- **Player testing** for major mechanic changes
- **Data analytics** to track game health metrics
- **Rollback procedures** for problematic changes

### Code Review Checklist
- [ ] **Functionality**: Does it meet requirements?
- [ ] **Performance**: No performance regressions?
- [ ] **Security**: Input validation and authorization?
- [ ] **Tests**: Adequate test coverage?
- [ ] **Documentation**: Updated docs and comments?
- [ ] **Game Balance**: Won't break economy/progression?

### Release Process
1. **Feature freeze** on `develop`
2. **Create release branch** (`release/v1.2.0`)
3. **Bug fixes** and final testing
4. **Merge to main** and tag release
5. **Deploy to production**
6. **Merge back to develop**

### Development Tools
- **Node.js 18+** for runtime
- **PostgreSQL** for persistent data
- **Redis** for caching and sessions
- **Socket.io** for real-time communication
- **Jest** for testing
- **ESLint** for code quality

### Communication
- **Discord**: Real-time development discussion
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Projects**: Sprint planning and roadmaps
- **Wiki**: Game mechanics documentation

## Getting Help
- Check existing issues and documentation first
- Ask questions in Discord #development channel
- Create detailed issue reports with reproduction steps
- Include relevant logs and error messages

## License
This project is licensed under MIT License - see LICENSE file for details.