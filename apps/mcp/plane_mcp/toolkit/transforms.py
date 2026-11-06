"""Surface-agnostic FastMCP listing transforms.

A transform here must be safe to apply to any catalogue. Anything that encodes a
specific catalogue's history -- the retired name aliases, for instance -- belongs with
that catalogue, not here.

`StripOutputSchemas` drops `outputSchema` from the advertised listing: two thirds
of the wire payload, for a field the MCP spec makes optional and defines as a
client-side validation contract. Execution is untouched, so clients that consume
`structuredContent` keep receiving it and lose validation only.
"""

from __future__ import annotations

from collections.abc import Sequence

from fastmcp.server.transforms import Transform
from fastmcp.tools.base import Tool


class StripOutputSchemas(Transform):
    async def list_tools(self, tools: Sequence[Tool]) -> Sequence[Tool]:
        return [tool.model_copy(update={"output_schema": None}) for tool in tools]
