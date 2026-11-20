# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import pytest

from plane.utils.pql import PqlError, parse_pql, tokenize
from plane.utils.pql.ast import (
    AndExpr,
    BetweenExpr,
    Comparison,
    FunctionCall,
    InExpr,
    IsEmptyExpr,
    IsNullExpr,
    LiteralValue,
    NotExpr,
    OrExpr,
    PredicateCall,
)

# Every documented example from plane_mcp/pql_reference.py
DOCUMENTED_REFERENCE_EXAMPLES = [
    # _FIELD_HINT_TEMPLATE
    'priority = "urgent" AND assignee = currentUser()',
    "stateGroup IN openStates() AND isOverdue()",
    # PQL_FIELD_DESCRIPTION & _FULL_REFERENCE_TEMPLATE Operator table + Examples
    'priority = "high"',
    'stateGroup != "completed"',
    "dueDate < today()",
    'title ~ "capex"',
    'priority IN ("high","urgent")',
    'stateGroup NOT IN ("completed","cancelled")',
    "dueDate IS NULL",
    "assignee IS NOT NULL",
    "label IS EMPTY",
    "label IS NOT EMPTY",
    "dueDate BETWEEN (daysAgo(7), today())",
    'priority = "high" AND NOT isArchived = true',
    'priority = "high" AND assignee = currentUser()',
    "isOverdue()",
    "stateGroup IN openStates() AND updatedAt < daysAgo(30)",
    "cycle IN activeCycle() AND stateGroup IN closedStates()",
    'title ~ "capex" AND priority IN ("high","urgent")',
    "createdAt >= startOfWeek()",
    'hasNoAssignee() AND priority = "urgent"',
    "isEpic() AND hasChildren()",
    "isSubWorkItem() AND hasStartAndDueDates()",
    'childOf("WEB-5")',
    'parentOf("WEB-5")',
    'linkedTo("WEB-5")',
    'blockedBy("WEB-5")',
    'blocks("WEB-5")',
    'duplicateOf("WEB-5")',
    'id = "WEB-11"',
    'id ~ "WEB"',
    'stateGroup NOT IN ("completed","cancelled") AND isOverdue()',
    'assignee = currentUser() AND label = "<label-uuid>" AND stateGroup = "started"',
    'cf["<prop-uuid>"] = "<option-uuid>"',
    'cf["<prop-uuid>"] IN ("<opt-uuid-1>", "<opt-uuid-2>")',
    'cf["<prop-uuid>"] IS NULL',
    'cf["<prop-uuid>"] IS NOT NULL',
    'cf["<decimal-prop-uuid>"] >= 5',
    'cf["<bool-prop-uuid>"] = true',
]


@pytest.mark.unit
class TestPqlLexerAndParser:
    @pytest.mark.parametrize("query", DOCUMENTED_REFERENCE_EXAMPLES)
    def test_documented_reference_examples_parse(self, query):
        ast = parse_pql(query)
        assert ast is not None

    def test_operator_precedence_not_higher_than_and_higher_than_or(self):
        # NOT a AND b OR c  ==>  ((NOT a) AND b) OR c
        ast = parse_pql('NOT isDraft() AND priority = "high" OR priority = "urgent"')
        assert isinstance(ast, OrExpr)
        assert len(ast.children) == 2
        left, right = ast.children
        assert isinstance(left, AndExpr)
        assert isinstance(left.children[0], NotExpr)
        assert isinstance(left.children[0].operand, PredicateCall)
        assert left.children[0].operand.name == "isDraft"
        assert isinstance(left.children[1], Comparison)
        assert isinstance(right, Comparison)

    def test_parentheses_override_precedence(self):
        # NOT (a AND (b OR c))
        ast = parse_pql('NOT (isDraft() AND (priority = "high" OR priority = "urgent"))')
        assert isinstance(ast, NotExpr)
        inner_and = ast.operand
        assert isinstance(inner_and, AndExpr)
        assert isinstance(inner_and.children[0], PredicateCall)
        inner_or = inner_and.children[1]
        assert isinstance(inner_or, OrExpr)
        assert len(inner_or.children) == 2

    @pytest.mark.parametrize("op", ["=", "!=", ">", ">=", "<", "<=", "~"])
    def test_all_comparison_operators(self, op):
        field = "title" if op == "~" else "dueDate"
        val = '"login"' if op == "~" else '"2025-01-15"'
        ast = parse_pql(f"{field} {op} {val}")
        assert isinstance(ast, Comparison)
        assert ast.field.name == field
        assert ast.op == op

    def test_in_and_not_in_operators_with_list_and_function(self):
        ast_in = parse_pql("priority IN (\"high\", 'urgent')")
        assert isinstance(ast_in, InExpr)
        assert ast_in.negated is False
        assert isinstance(ast_in.values, tuple)
        assert [v.value for v in ast_in.values] == ["high", "urgent"]

        ast_not_in = parse_pql("stateGroup NOT IN openStates()")
        assert isinstance(ast_not_in, InExpr)
        assert ast_not_in.negated is True
        assert isinstance(ast_not_in.values, FunctionCall)
        assert ast_not_in.values.name == "openStates"

    def test_is_null_and_is_empty_operators(self):
        ast_null = parse_pql("dueDate IS NULL")
        assert isinstance(ast_null, IsNullExpr) and ast_null.negated is False

        ast_not_null = parse_pql("dueDate IS NOT NULL")
        assert isinstance(ast_not_null, IsNullExpr) and ast_not_null.negated is True

        ast_empty = parse_pql("label IS EMPTY")
        assert isinstance(ast_empty, IsEmptyExpr) and ast_empty.negated is False

        ast_not_empty = parse_pql("label IS NOT EMPTY")
        assert isinstance(ast_not_empty, IsEmptyExpr) and ast_not_empty.negated is True

    def test_between_both_forms_and_combinator_after_between(self):
        # Form 1: BETWEEN (a, b)
        ast_paren = parse_pql("dueDate BETWEEN (daysAgo(7), today()) AND isOverdue()")
        assert isinstance(ast_paren, AndExpr)
        b1 = ast_paren.children[0]
        assert isinstance(b1, BetweenExpr)
        assert isinstance(b1.low, FunctionCall) and b1.low.name == "daysAgo"
        assert isinstance(b1.high, FunctionCall) and b1.high.name == "today"

        # Form 2: BETWEEN a AND b followed by logical AND
        ast_and = parse_pql('dueDate BETWEEN "2025-01-01" AND "2025-01-31" AND priority = "high"')
        assert isinstance(ast_and, AndExpr)
        b2 = ast_and.children[0]
        assert isinstance(b2, BetweenExpr)
        assert isinstance(b2.low, LiteralValue) and b2.low.value == "2025-01-01"
        assert isinstance(b2.high, LiteralValue) and b2.high.value == "2025-01-31"
        assert isinstance(ast_and.children[1], Comparison)

    def test_case_insensitive_keywords_and_case_sensitive_fields(self):
        ast = parse_pql(
            "priority in ('high', 'urgent') and dueDate between '2025-01-01' and '2025-01-10' "
            "or not (label is not empty and isDraft = FALSE)"
        )
        assert isinstance(ast, OrExpr)

        for wrong_field in ("Priority", "stategroup", "duedate", "isdraft", "createdat"):
            with pytest.raises(PqlError) as exc_info:
                parse_pql(f'{wrong_field} = "high"')
            assert "Unknown field" in str(exc_info.value)

    def test_single_and_double_quoted_strings_and_escapes(self):
        ast1 = parse_pql(r"""title ~ "say \"hello\"" AND text ~ 'it\'s working'""")
        assert isinstance(ast1, AndExpr)
        assert ast1.children[0].value.value == 'say "hello"'
        assert ast1.children[1].value.value == "it's working"

    def test_all_date_user_cycle_state_predicate_and_relation_functions_parse(self):
        date_fns_0 = [
            "today()",
            "now()",
            "startOfDay()",
            "endOfDay()",
            "startOfWeek()",
            "endOfWeek()",
            "startOfMonth()",
            "endOfMonth()",
            "startOfYear()",
            "endOfYear()",
        ]
        for fn in date_fns_0:
            ast = parse_pql(f"dueDate >= {fn}")
            assert isinstance(ast, Comparison)

        date_fns_1 = [
            "daysAgo(5)",
            "daysFromNow(5)",
            "weeksAgo(2)",
            "weeksFromNow(2)",
            "monthsAgo(1)",
            "monthsFromNow(3)",
        ]
        for fn in date_fns_1:
            ast = parse_pql(f"createdAt <= {fn}")
            assert isinstance(ast, Comparison)

        for user_fn in [
            "currentUser()",
            'membersOf("project:550e8400-e29b-41d4-a716-446655440000")',
            "workspaceMembers()",
        ]:
            ast = parse_pql(f"assignee IN {user_fn}")
            assert isinstance(ast, InExpr)

        for cycle_fn in ["activeCycle()", "completedCycles()", "upcomingCycles()"]:
            ast = parse_pql(f"cycle IN {cycle_fn}")
            assert isinstance(ast, InExpr)

        for sg_fn in ["openStates()", "closedStates()", "activeStates()"]:
            ast = parse_pql(f"stateGroup IN {sg_fn}")
            assert isinstance(ast, InExpr)

        predicates = [
            "isOverdue()",
            "hasNoAssignee()",
            "hasNoLabel()",
            "isTopLevel()",
            "isSubWorkItem()",
            "isEpic()",
            "hasChildren()",
            "hasStartAndDueDates()",
            "isDraft()",
            "isArchived()",
            "isIntake()",
        ]
        for pred in predicates:
            ast = parse_pql(pred)
            assert isinstance(ast, PredicateCall)

        relations = [
            'childOf("WEB-5")',
            'parentOf("WEB-5")',
            'linkedTo("WEB-5")',
            'blockedBy("WEB-5")',
            'blocks("WEB-5")',
            'duplicateOf("WEB-5")',
        ]
        for rel in relations:
            ast = parse_pql(rel)
            assert isinstance(ast, PredicateCall)

    def test_limit_query_length_2000(self):
        padding = " " * (2000 - len('priority = "high"'))
        ok_query = f'priority = "high"{padding}'
        assert len(ok_query) == 2000
        assert parse_pql(ok_query) is not None

        too_long = ok_query + " "
        with pytest.raises(PqlError) as exc_info:
            parse_pql(too_long)
        assert "maximum length of 2000" in str(exc_info.value)

    def test_limit_max_5_conditions(self):
        five_conds = (
            'priority IN ("high", "urgent") '
            'AND dueDate BETWEEN ("2025-01-01", "2025-01-31") '
            "AND isOverdue() "
            'AND childOf("WEB-1") '
            "AND label IS NOT EMPTY"
        )
        assert parse_pql(five_conds) is not None

        six_conds = five_conds + ' AND stateGroup = "started"'
        with pytest.raises(PqlError) as exc_info:
            parse_pql(six_conds)
        assert "maximum of 5 conditions" in str(exc_info.value)

    def test_limit_max_nesting_depth_10(self):
        depth_10 = "(" * 10 + 'priority = "high"' + ")" * 10
        assert parse_pql(depth_10) is not None

        depth_11 = "(" * 11 + 'priority = "high"' + ")" * 11
        with pytest.raises(PqlError) as exc_info:
            parse_pql(depth_11)
        assert "maximum nesting depth of 10" in str(exc_info.value)

    def test_limit_max_nesting_depth_counts_not_chains(self):
        assert parse_pql("NOT " * 10 + "isDraft()") is not None
        with pytest.raises(PqlError) as exc_info:
            parse_pql("NOT " * 11 + "isDraft()")
        assert "maximum nesting depth of 10" in str(exc_info.value)

    def test_in_counts_as_one_condition_and_between_counts_as_one(self):
        query = (
            'priority IN ("urgent", "high", "medium", "low", "none") '
            'AND dueDate BETWEEN "2025-01-01" AND "2025-01-31" '
            'AND startDate BETWEEN ("2025-01-01", "2025-01-31") '
            "AND stateGroup NOT IN openStates() "
            "AND hasNoLabel()"
        )
        assert parse_pql(query) is not None

    def test_negative_numbers_tokenize_but_arithmetic_does_not(self):
        tokens = tokenize("dueDate >= daysAgo(-1)")
        assert any(t.value == -1 for t in tokens)
        with pytest.raises(PqlError):
            tokenize("dueDate >= today() - 7")

    @pytest.mark.parametrize(
        "bad_query,expected_substring",
        [
            ("", "cannot be empty"),
            ("   ", "cannot be empty"),
            ('priority = "unterminated', "Unterminated string literal"),
            ('priority = "high" @', "Unexpected character '@'"),
            ('(priority = "high"', "Expected ')'"),
            ('priority = "high" "extra"', "Unexpected token"),
            ("dueDate >= today() - 7", "Arithmetic operator"),
            ("dueDate >= startOfWeek() + 1", "Arithmetic operator"),
            ("dueDate >= daysAgo()", "non-negative integer"),
            ('dueDate >= daysAgo("5")', "non-negative integer"),
            ("dueDate >= daysAgo(-1)", "non-negative integer"),
            ("dueDate >= today(1)", "takes no arguments"),
            ("childOf()", "requires a single work item"),
            ('childOf("")', "requires a single work item"),
            ("isOverdue(1)", "takes no arguments"),
            ('cf[123] = "val"', "custom property UUID string"),
            ('cf[""] = "val"', "cannot be empty"),
            ("priority =", "Expected value"),
            ("priority", "Expected comparison operator"),
            ("priority IN ()", "IN list cannot be empty"),
            ("dueDate IS 5", "Expected 'NULL' or 'EMPTY'"),
            ("()", "Empty parentheses"),
            ("today()", "cannot be used as a standalone condition"),
            ("priority = isOverdue()", "cannot be used as a value"),
            ("bogus()", "Unknown function"),
            ("bogus = 1", "Unknown field"),
        ],
    )
    def test_syntax_errors_report_reason_and_position(self, bad_query, expected_substring):
        with pytest.raises(PqlError) as exc_info:
            parse_pql(bad_query)
        msg = str(exc_info.value)
        assert expected_substring in msg
        assert "position" in msg


@pytest.mark.unit
def test_history_function_arguments_are_not_validated_by_the_parser():
    expr = parse_pql('wasEver(priority, "high", nested(1))')
    assert isinstance(expr, PredicateCall) and expr.name == "wasEver"
    with pytest.raises(PqlError):
        parse_pql('wasEver(priority, "high"')
