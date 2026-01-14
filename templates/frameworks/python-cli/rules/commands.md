# CLI Command Patterns

## Command Definition
```python
# src/my_cli/commands/init.py
import typer
from pathlib import Path
from rich.console import Console

app = typer.Typer(help="Initialize a new project")
console = Console()

@app.command()
def project(
    name: str = typer.Argument(..., help="Project name"),
    path: Path = typer.Option(".", "--path", "-p", help="Target directory"),
    force: bool = typer.Option(False, "--force", "-f", help="Overwrite existing"),
):
    """Initialize a new project with the given name."""
    target = path / name

    if target.exists() and not force:
        console.print(f"[red]Error:[/red] {target} already exists. Use --force to overwrite.")
        raise typer.Exit(1)

    # Create project structure
    target.mkdir(parents=True, exist_ok=True)
    (target / "README.md").write_text(f"# {name}\n")

    console.print(f"[green]✓[/green] Created project at {target}")
```

## Arguments and Options
```python
@app.command()
def process(
    # Required argument
    input_file: Path = typer.Argument(..., help="Input file to process"),

    # Optional argument with default
    output: Path = typer.Argument("output.txt", help="Output file"),

    # Options
    verbose: bool = typer.Option(False, "--verbose", "-v"),
    count: int = typer.Option(10, "--count", "-n", min=1, max=100),
    format: str = typer.Option("json", "--format", "-f", help="Output format"),
):
    ...
```

## Choice Options
```python
from enum import Enum

class OutputFormat(str, Enum):
    json = "json"
    yaml = "yaml"
    text = "text"

@app.command()
def export(
    format: OutputFormat = typer.Option(OutputFormat.json, "--format", "-f"),
):
    if format == OutputFormat.json:
        ...
```

## Interactive Prompts
```python
@app.command()
def configure():
    name = typer.prompt("Project name")
    description = typer.prompt("Description", default="")
    confirm = typer.confirm("Create project?")

    if not confirm:
        raise typer.Abort()

    # Create project...
```

## Progress and Output
```python
from rich.progress import track
from rich.table import Table

@app.command()
def process_files(files: list[Path] = typer.Argument(...)):
    results = []
    for file in track(files, description="Processing..."):
        result = process_file(file)
        results.append(result)

    # Display results table
    table = Table(title="Results")
    table.add_column("File")
    table.add_column("Status")

    for r in results:
        table.add_row(r.file, r.status)

    console.print(table)
```
