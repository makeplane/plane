from django.db import connection


def get_descendant_page_ids(page_id):
    sql = """
    WITH RECURSIVE descendants AS (
        SELECT id FROM pages WHERE parent_id = %s AND deleted_at IS NULL AND moved_to_page IS NULL
        UNION ALL
        SELECT pages.id FROM pages, descendants 
        WHERE pages.parent_id = descendants.id 
        AND pages.deleted_at IS NULL 
        AND pages.moved_to_page IS NULL
    )
    SELECT id FROM descendants;
    """

    with connection.cursor() as cursor:
        cursor.execute(sql, [page_id])
        result = cursor.fetchall()

    return [row[0] for row in result]


def get_all_parent_ids(page_id):
    query = """
    WITH RECURSIVE page_hierarchy AS (
        SELECT id, parent_id
        FROM pages
        WHERE id = %s

        UNION ALL

        SELECT p.id, p.parent_id
        FROM pages p
        JOIN page_hierarchy ph ON p.id = ph.parent_id
    )
    SELECT id FROM page_hierarchy;  -- Include the current page as well
    """

    with connection.cursor() as cursor:
        cursor.execute(query, [page_id])
        return [row[0] for row in cursor.fetchall()]
