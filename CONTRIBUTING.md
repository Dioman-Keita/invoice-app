# Contributing to Invoice App

First off, thank you for considering contributing to Invoice App! It's people like you that make Invoice App such a great tool for the CMDT.

The following is a set of guidelines for contributing to Invoice App. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## Code of Conduct

This project and everyone participating in it is governed by the [Invoice App Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [diomankeita001@gmail.com].

## 🚀 Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork to your local machine:

    ```bash
    git clone https://github.com/your-username/invoice-app.git
    cd invoice-app
    ```

3. **Install dependencies**:

    ```bash
    npm install
    npm install --prefix client
    npm install --prefix server
    ```

4. **Configure Environment**:
    - Copy `server/.env.example` to `server/.env` and update the values.

## 🤝 How to Contribute

### Reporting Bugs

See the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) for details.

### Pull Requests

1. **Branching**: Create a new branch for each feature or improvement.

    ```bash
    git checkout -b feature/amazing-feature
    ```

2. **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, etc.
3. **Code Style**: Follow ESLint rules. Run `npm run lint` before committing.

## 🛠 Development Workflow

### Application Structure

- **`client/`**: React Frontend (Vite)
- **`server/`**: Express Backend (TypeScript)
- **`main.js`**: Electron entry point / Stack Orchestrator

### Running Locally

You don't need to start services manually. The orchestrator handles everything:

1. **Build the server once**:

    ```bash
    npm run build --prefix server
    ```

2. **Start the hybrid stack**:

    ```bash
    npm run electron:dev
    ```

This will automatically start Docker MySQL, the Vite dev server, and the Express backend forked process.

## 📝 License

By contributing, you agree that your contributions will be licensed under its MIT License.
