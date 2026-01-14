# Python CLI Project Structure

## Directory Layout
```
my-cli/
├── src/
│   └── my_cli/
│       ├── __init__.py
│       ├── __main__.py        # Entry point
│       ├── cli.py             # CLI definition
│       ├── commands/
│       │   ├── __init__.py
│       │   ├── init.py
│       │   └── run.py
│       ├── config.py
│       └── utils.py
├── tests/
│   └── test_commands.py
├── pyproject.toml
└── README.md
```

## Main Entry Point
```python
# src/my_cli/__main__.py
from .cli import app

if __name__ == "__main__":
    app()
```

## CLI Definition (Typer)
```python
# src/my_cli/cli.py
import typer
from typing import Optional

from .commands import init, run

app = typer.Typer(
    name="my-cli",
    help="My CLI tool description",
    add_completion=False,
)

# Add subcommands
app.add_typer(init.app, name="init")
app.add_typer(run.app, name="run")

@app.callback()
def main(
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Verbose output"),
    config: Optional[str] = typer.Option(None, "--config", "-c", help="Config file"),
):
    """My CLI tool - does useful things."""
    if verbose:
        # Set up verbose logging
        pass
```

## pyproject.toml
```toml
[project]
name = "my-cli"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "typer>=0.9.0",
    "rich>=13.0.0",
]

[project.scripts]
my-cli = "my_cli.cli:app"

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-cov>=4.0",
]
```

## Installation
```bash
# Development install
pip install -e ".[dev]"

# Run
my-cli --help
my-cli init
my-cli run --verbose
```
