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

dupes_human_prompt = """Query Issue:
Title: {query_title}
Description: {query_description}

Candidate Issues (numbered list):
{candidates_text}

Identify which candidate issues are duplicates of the query issue. Return only the serial numbers (e.g., 1, 3, 5) of true duplicates."""


dupes_system_prompt = """You are an expert at identifying duplicate issues. Your task is to analyze a query issue against a numbered list of candidate issues and identify which ones are true duplicates.

Two issues are duplicates if they:
1. Address the same core problem or request
2. Have substantially similar goals or objectives
3. Would require the same or very similar solution
4. Are not just related but actually requesting the same functionality

Return the serial numbers of duplicate candidates in a comma-separated list, not their IDs."""  # noqa: E501

# O3 suggested prompt
# SYSTEM:
# You are a QA assistant checking if a new issue already exists.

# USER:
# New issue title: "{new_title}"
# (Optionally) New issue description: "{new_desc}"

# Here are 10 candidate issues (id, title):
# 1. {id1} — {title1}
# ...
# 10. {id10} — {title10}

# TASK:
# Return a JSON array of the ids that describe the SAME problem
# as the new issue. Only include ids that you judge as true duplicates.
# If none are duplicates return [].

# Think step-by-step *briefly* before you output the JSON.
