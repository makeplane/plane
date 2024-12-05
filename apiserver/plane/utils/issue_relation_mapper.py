def get_inverse_relation(relation_type):
    relation_mapping = {
        "start_after": "start_before",
        "finish_after": "finish_before",
        "blocked_by": "blocking",
        "blocking": "blocked_by",
        "start_before": "start_after",
        "finish_before": "finish_after",
    }
    return relation_mapping.get(relation_type, relation_type)


def get_actual_relation(relation_type):
    # This function is used to get the actual relation type which is store in database
    actual_relation = {
        "start_after": "start_before",
        "finish_after": "finish_before",
        "blocking": "blocked_by",
        "blocked_by": "blocked_by",
        "start_before": "start_before",
        "finish_before": "finish_before",
    }

    return actual_relation.get(relation_type, relation_type)
