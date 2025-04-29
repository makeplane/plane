# Django imports
from django.db import connection


def get_all_related_work_items(work_item_id: str) -> list[str]:
    query = """
    WITH RECURSIVE Descendants AS (
        -- Base case: Start with the given parent issue
        SELECT id, parent_id
        FROM issues
        WHERE parent_id = %s

        UNION ALL

        -- Recursive case: Find children of each issue
        SELECT i.id, i.parent_id
        FROM issues i
        INNER JOIN Descendants d ON i.parent_id = d.id
    )
    SELECT id
    FROM Descendants;
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [work_item_id])
        result = cursor.fetchall()

    # Extract IDs from the result
    descendant_ids = [row[0] for row in result]

    # Return as a queryset
    return descendant_ids
