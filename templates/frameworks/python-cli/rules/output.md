# CLI Output Best Practices

## Rich Console Output
```python
from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax

console = Console()

# Colors and styles
console.print("[green]Success![/green] Operation completed.")
console.print("[red]Error:[/red] Something went wrong.")
console.print("[yellow]Warning:[/yellow] Proceed with caution.")
console.print("[bold]Important:[/bold] Read this carefully.")

# Panels for grouped info
console.print(Panel("This is important information", title="Notice"))

# Code highlighting
code = Syntax(source_code, "python", theme="monokai")
console.print(code)
```

## Structured Output
```python
from rich.table import Table

def show_results(items: list[Item]):
    table = Table(title="Results", show_header=True)
    table.add_column("ID", style="cyan")
    table.add_column("Name")
    table.add_column("Status", justify="center")

    for item in items:
        status_color = "green" if item.active else "red"
        table.add_row(
            str(item.id),
            item.name,
            f"[{status_color}]{'Active' if item.active else 'Inactive'}[/]"
        )

    console.print(table)
```

## Progress Indicators
```python
from rich.progress import Progress, SpinnerColumn, TextColumn

# Simple progress
for item in track(items, description="Processing..."):
    process(item)

# Custom progress
with Progress(
    SpinnerColumn(),
    TextColumn("[progress.description]{task.description}"),
) as progress:
    task = progress.add_task("Loading...", total=None)
    result = long_running_operation()
    progress.update(task, completed=True)
```

## JSON/Machine Output
```python
import json

@app.command()
def list_items(
    json_output: bool = typer.Option(False, "--json", help="Output as JSON"),
):
    items = get_items()

    if json_output:
        # Machine-readable output
        print(json.dumps([i.dict() for i in items], indent=2))
    else:
        # Human-readable output
        show_results(items)
```

## Exit Codes
```python
# Success
raise typer.Exit(0)

# General error
raise typer.Exit(1)

# User abort
raise typer.Abort()

# Specific exit codes
EXIT_SUCCESS = 0
EXIT_ERROR = 1
EXIT_USAGE = 2
EXIT_CONFIG = 3
```

## Error Messages
```python
def handle_error(e: Exception):
    console.print(f"[red]Error:[/red] {e}")
    if verbose:
        console.print_exception()
    raise typer.Exit(1)
```
