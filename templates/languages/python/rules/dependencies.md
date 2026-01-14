# Python Dependency Management

## Project Structure
```
myproject/
├── pyproject.toml      # Project config (preferred)
├── requirements.txt    # Or traditional requirements
├── src/
│   └── myproject/
│       ├── __init__.py
│       └── main.py
├── tests/
│   └── test_main.py
└── .venv/              # Virtual environment (gitignored)
```

## Virtual Environments
```bash
# Create
python -m venv .venv

# Activate
source .venv/bin/activate  # Unix
.venv\Scripts\activate     # Windows

# Always use virtual environments
# Never install globally with sudo pip
```

## pyproject.toml (Modern)
```toml
[project]
name = "myproject"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "fastapi>=0.100.0",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "ruff>=0.1.0",
    "mypy>=1.0",
]

[tool.ruff]
line-length = 88
select = ["E", "F", "I", "N", "W"]

[tool.mypy]
strict = true
```

## Dependency Best Practices
- Pin major versions: `requests>=2.28,<3`
- Use lock files for reproducibility (pip-tools, poetry.lock)
- Separate dev dependencies
- Audit regularly: `pip-audit` or `safety check`
- Minimize dependencies

## Common Tools
```bash
# Install with dev deps
pip install -e ".[dev]"

# Format and lint
ruff check --fix .
ruff format .

# Type check
mypy src/

# Run tests
pytest -v --cov=src
```
