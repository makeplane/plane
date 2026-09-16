# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Roster parsing: header tolerance, encoding and degree wording."""

import io

import pytest
from openpyxl import Workbook

from plane.research.services.accounts import AccountError
from plane.research.services.user_import import (
    HEADER_ALIASES,
    normalise_degree,
    parse_advisors,
    parse_students,
    sheet_rows,
)

pytestmark = pytest.mark.unit

CSV_ROSTER = (
    "分组,姓名,学号,年级,学位,负责导师,邮件,电话\n"
    "器件,邱智鑫,20220230156625,23,Ph.D,刘俊扬,qiuzhixin@stu.xmu.edu.cn,17706010502\n"
    "量子,高靖琦,20620251151728,25,硕士,陈志昕,gaojingqi@stu.xmu.edu.cn,15803745516\n"
)


def test_csv_headers_and_values_are_parsed():
    rows = parse_students(CSV_ROSTER.encode("utf-8"), "roster.csv")
    assert len(rows) == 2
    first = rows[0]
    assert first.row_number == 2
    assert first.name == "邱智鑫"
    assert first.email == "qiuzhixin@stu.xmu.edu.cn"
    assert first.student_no == "20220230156625"
    assert first.degree == "PHD"
    assert first.group == "器件"
    assert first.advisor == "刘俊扬"
    assert first.raw["phone"] == "17706010502"


def test_english_headers_and_bom_are_accepted():
    payload = ("\ufeffgroup,name,student_no,grade,degree,advisor,email,phone\n"
               "Device,Alice,2022001,24,MS,Liujunyang,alice@example.com,123\n")
    rows = parse_students(payload.encode("utf-8"), "roster.csv")
    assert rows[0].name == "Alice"
    assert rows[0].degree == "MS"


def test_gb18030_csv_is_decoded():
    payload = CSV_ROSTER.encode("gb18030")
    rows = parse_students(payload, "roster.csv")
    assert rows[0].name == "邱智鑫"


def test_xlsx_roster_is_parsed():
    workbook = Workbook()
    sheet = workbook.active
    sheet.append(["分组", "姓名", "学号", "年级", "学位", "负责导师", "邮件", "电话"])
    sheet.append(["器件", "邱智鑫", "20220230156625", "23", "Ph.D", "刘俊扬", "q@example.com", "177"])
    buffer = io.BytesIO()
    workbook.save(buffer)

    rows = parse_students(buffer.getvalue(), "roster.xlsx")
    assert len(rows) == 1
    assert rows[0].email == "q@example.com"
    assert rows[0].degree == "PHD"


def test_missing_required_headers_are_rejected():
    with pytest.raises(AccountError) as error:
        parse_students("foo,bar\n1,2\n".encode("utf-8"), "roster.csv")
    assert error.value.error_code == "user_import_file_invalid"


def test_empty_payload_is_rejected():
    with pytest.raises(AccountError) as error:
        sheet_rows(b"", "roster.csv")
    assert error.value.error_code == "user_import_file_required"


def test_degree_wording_mapping():
    assert normalise_degree("MS") == "MS"
    assert normalise_degree("硕士") == "MS"
    assert normalise_degree("Ph.D") == "PHD"
    assert normalise_degree("博士") == "PHD"
    assert normalise_degree("") == ""
    assert normalise_degree("unknown") == ""


def test_advisor_table_is_normalised():
    payload = "导师,邮箱\n刘俊扬,liujunyang@xmu.edu.cn\n 陈志昕 ,chenzhixin@xmu.edu.cn\n"
    advisors = parse_advisors(payload.encode("utf-8"), "advisors.csv")
    assert advisors["刘俊扬"] == "liujunyang@xmu.edu.cn"
    assert advisors["陈志昕"] == "chenzhixin@xmu.edu.cn"


def test_header_alias_table_covers_the_roster_columns():
    for field_name in ("group", "name", "student_no", "grade", "degree", "advisor", "email", "phone"):
        assert field_name in HEADER_ALIASES
