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

3. **Install dependencies** using the setup script or manually:

    ```bash
    # Ensure Docker is running first!
    cd server && npm install
    cd ../client && npm install
    ```

4. **Configure Environment**:
    - Copy `server/.env.example` to `server/.env` and update the values.

## 🤝 How to Contribute

### Reporting Bugs

This section guides you through submitting a bug report.

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps to reproduce the problem** in as many details as possible.
- **Provide specific examples** to demonstrate the steps (include screenshots if possible).

### Pull Requests

1. **Branching**: Create a new branch for each feature or improvement.

    ```bash
    git checkout -b feature/amazing-feature
    ```

2. **Commits**: Make sure your commit messages are clear. We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification (e.g., `feat: add user login`, `fix: correct invoice total`).
3. **Code Style**:
    - **Backend**: Strict TypeScript. Ensure no `any` types if possible.
    - **Frontend**: React + Hooks. Use functional components.
    - **Formatting**: The project uses Prettier/ESLint. Run `npm run lint` before committing.
4. **Testing**:
    - Ensure your changes do not break existing functionality.
    - Test standard flows (Login -> Create Invoice -> Export).

## 🛠 Development Workflow

### Application Structure

- **`client/`**: React Frontend (Vite)
- **`server/`**: Express Backend (TypeScript)
- **`main.js`**: Electron entry point

### Running Locally

To run the full hybrid stack:

1. Start MySQL Database:

    ```bash
    cd server
    ./manage-stack.bat # Windows
    # or ./manage-stack.sh # Linux/Mac
    ```

2. Start Backend (Port 3000):

    ```bash
    npm run dev
    ```

3. Start Frontend (Port 5173):

    ```bash
    cd ../client
    npm run dev
    ```

4. (Optional) Start Electron:

    ```bash
    npm run electron:dev
    ```

## 📝 License

By contributing, you agree that your contributions will be licensed under its MIT License.
