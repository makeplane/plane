# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import asyncio
import os
import sys

# Ensure we can import from the app
sys.path.append(os.getcwd())
# load_dotenv()

from pi.services.llm import llms


async def main():
    print("Verifying LazyLLM implementation via ChatKit.tool_llm...")
    print("(Global singleton LLM instances have been removed; LazyLLM is used by ChatKit)")

    print("\nVerifying ChatKit.tool_llm implementation...")
    from pi.services.chat.kit import ChatKit

    # Instantiate ChatKit
    chat_kit = ChatKit()
    lazy_tool_llm = chat_kit.tool_llm

    print(f"ChatKit.tool_llm type: {type(lazy_tool_llm)}")
    print(f"Is instance of LazyLLM? {isinstance(lazy_tool_llm, llms.LazyLLM)}")

    # Check internal state BEFORE access
    if hasattr(lazy_tool_llm, "_proxy_target"):
        print(f"Internal _proxy_target before access: {lazy_tool_llm._proxy_target}")
        if lazy_tool_llm._proxy_target is None:
            print("SUCCESS: ChatKit.tool_llm is not yet initialized.")
        else:
            print("FAILURE: ChatKit.tool_llm is already initialized!")
    else:
        print("FAILURE: LazyLLM structure not found in ChatKit.tool_llm.")

    # Trigger initialization
    print("\nTriggering ChatKit.tool_llm initialization via attribute access...")
    _ = lazy_tool_llm.model_name

    # Check internal state AFTER access
    print(f"Internal _proxy_target after access: {lazy_tool_llm._proxy_target}")
    if lazy_tool_llm._proxy_target is not None:
        print("SUCCESS: ChatKit.tool_llm initialized on demand.")
    else:
        print("FAILURE: ChatKit.tool_llm did not initialize!")

    print("\nVerification Complete.")


if __name__ == "__main__":
    asyncio.run(main())
