# MCP Server Structure (Python)

## Project Layout
```
my-mcp-server/
├── src/
│   └── my_mcp_server/
│       ├── __init__.py
│       ├── server.py          # Main MCP server
│       ├── tools.py           # Tool definitions
│       ├── resources.py       # Resource providers
│       └── prompts.py         # Prompt templates
├── tests/
│   └── test_tools.py
├── pyproject.toml
└── README.md
```

## Main Server
```python
# src/my_mcp_server/server.py
import asyncio
from mcp.server import Server
from mcp.server.stdio import stdio_server

from .tools import register_tools
from .resources import register_resources
from .prompts import register_prompts

server = Server("my-mcp-server")

# Register capabilities
register_tools(server)
register_resources(server)
register_prompts(server)

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

## pyproject.toml
```toml
[project]
name = "my-mcp-server"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "mcp>=0.9.0",
]

[project.scripts]
my-mcp-server = "my_mcp_server.server:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

## Running
```bash
# Development
python -m my_mcp_server.server

# After install
my-mcp-server
```
