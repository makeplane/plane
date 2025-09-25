def get_inverse_relation(relation_type):
    relation_mapping = {
        "start_after": "start_before",
        "finish_after": "finish_before",
        "blocked_by": "blocking",
        "blocking": "blocked_by",
        "start_before": "start_after",
        "finish_before": "finish_after",
        "implemented_by": "implements",
        "implements": "implemented_by",
    }
    return relation_mapping.get(relation_type, relation_type)


def get_actual_relation(relation_type):
    # This function is used to get the actual relation type which is stored in database
    actual_relation = {
        "start_after": "start_before",
        "finish_after": "finish_before",
        "blocking": "blocked_by",
        "blocked_by": "blocked_by",
        "start_before": "start_before",
        "finish_before": "finish_before",
        "implemented_by": "implemented_by",
        "implements": "implemented_by",
    }

    return actual_relation.get(relation_type, relation_type)
