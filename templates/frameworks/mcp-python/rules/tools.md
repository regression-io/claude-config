# MCP Tool Definition Rules

## Tool Structure
```python
# src/my_mcp_server/tools.py
from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field

class SearchArgs(BaseModel):
    """Arguments for the search tool."""
    query: str = Field(..., description="Search query string")
    limit: int = Field(10, description="Maximum results to return", ge=1, le=100)

def register_tools(server: Server):
    @server.list_tools()
    async def list_tools():
        return [
            Tool(
                name="search",
                description="Search for items in the database",
                inputSchema=SearchArgs.model_json_schema(),
            ),
            Tool(
                name="create_item",
                description="Create a new item",
                inputSchema=CreateItemArgs.model_json_schema(),
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict):
        if name == "search":
            args = SearchArgs(**arguments)
            results = await do_search(args.query, args.limit)
            return [TextContent(type="text", text=format_results(results))]

        if name == "create_item":
            args = CreateItemArgs(**arguments)
            item = await create_item(args)
            return [TextContent(type="text", text=f"Created item: {item.id}")]

        raise ValueError(f"Unknown tool: {name}")
```

## Tool Design Guidelines
- **Single responsibility**: Each tool does one thing
- **Clear naming**: `verb_noun` pattern (search_users, create_item)
- **Detailed descriptions**: Help the LLM understand when to use it
- **Typed arguments**: Use Pydantic models with Field descriptions
- **Meaningful output**: Return structured, useful information

## Input Validation
```python
class CreateItemArgs(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    tags: list[str] = Field(default_factory=list, max_length=10)

    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v):
        return [tag.lower().strip() for tag in v]
```

## Error Handling
```python
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    try:
        if name == "search":
            args = SearchArgs(**arguments)
            results = await do_search(args.query, args.limit)
            return [TextContent(type="text", text=format_results(results))]
    except ValidationError as e:
        return [TextContent(type="text", text=f"Validation error: {e}")]
    except Exception as e:
        logger.error(f"Tool error: {e}")
        return [TextContent(type="text", text=f"Error: {str(e)}")]
```
