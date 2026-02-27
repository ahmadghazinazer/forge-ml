# Contributing to forge-ml

Thank you for considering contributing. Here are a few guidelines to keep things consistent.

## Setup

1. Fork the repository and clone your fork.
2. Create a virtual environment and install backend dependencies:
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Code Style

- Python: follow PEP 8. Use type hints where practical.
- JavaScript: use functional components and hooks. No class components.
- Minimal comments. Code should be self-explanatory. Comment only when the "why" is not obvious.
- No auto-generated docstrings or boilerplate.

## Pull Requests

- One feature or fix per PR.
- Include a clear description of what changed and why.
- Make sure the backend starts without errors: `cd backend && python main.py`
- Make sure the frontend builds: `cd frontend && npm run build`

## Reporting Issues

Open an issue with a clear title and reproduction steps. Include the Python/Node versions you are using.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
