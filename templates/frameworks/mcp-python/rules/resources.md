# MCP Resources Rules

## Resource Definition
```python
# src/my_mcp_server/resources.py
from mcp.server import Server
from mcp.types import Resource, TextResourceContents, BlobResourceContents

def register_resources(server: Server):
    @server.list_resources()
    async def list_resources():
        return [
            Resource(
                uri="myapp://config/settings",
                name="Application Settings",
                description="Current application configuration",
                mimeType="application/json",
            ),
            Resource(
                uri="myapp://data/users",
                name="User List",
                description="List of all users in the system",
                mimeType="application/json",
            ),
        ]

    @server.read_resource()
    async def read_resource(uri: str):
        if uri == "myapp://config/settings":
            settings = await get_settings()
            return TextResourceContents(
                uri=uri,
                mimeType="application/json",
                text=json.dumps(settings, indent=2),
            )

        if uri == "myapp://data/users":
            users = await get_all_users()
            return TextResourceContents(
                uri=uri,
                mimeType="application/json",
                text=json.dumps([u.dict() for u in users], indent=2),
            )

        raise ValueError(f"Unknown resource: {uri}")
```

## Resource Types

### Text Resources
```python
# For JSON, text, code, etc.
TextResourceContents(
    uri="myapp://file.json",
    mimeType="application/json",
    text='{"key": "value"}',
)
```

### Binary Resources
```python
# For images, PDFs, etc.
import base64

BlobResourceContents(
    uri="myapp://image.png",
    mimeType="image/png",
    blob=base64.b64encode(image_bytes).decode(),
)
```

## Dynamic Resources
```python
@server.list_resources()
async def list_resources():
    # Dynamically list available resources
    files = await list_available_files()
    return [
        Resource(
            uri=f"myapp://files/{f.id}",
            name=f.name,
            description=f"File: {f.name}",
            mimeType=f.mime_type,
        )
        for f in files
    ]
```

## URI Patterns
- Use custom scheme: `myapp://`
- Hierarchical: `myapp://category/item`
- Query params for filtering: `myapp://users?active=true`
- Keep URIs stable and predictable
