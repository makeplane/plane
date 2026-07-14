# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Payroll arithmetic: aguinaldo and annual cost.

Kept out of the views so the numbers can be reasoned about — and tested — on
their own. Every amount is Decimal and every total is grouped by currency:
adding MXN to USD produces a number that is simply wrong.
"""

from datetime import date
from decimal import Decimal

CENTS = Decimal("0.01")
DAYS_IN_YEAR = Decimal(365)


def _quantize(value):
    return Decimal(value).quantize(CENTS)


def days_worked_in_year(employee, year):
    """Days the employee was on payroll during `year`, both ends inclusive.

    Someone hired in November has worked ~2 months, and their aguinaldo is
    proportional to exactly that — which is the whole point of the LFT rule.
    """
    year_start = date(year, 1, 1)
    year_end = date(year, 12, 31)

    start = max(employee.hire_date, year_start)
    end = min(employee.termination_date or year_end, year_end)

    if start > end:
        # Hired after the year ended, or left before it began
        return 0
    return (end - start).days + 1


def salary_in_force(salaries, on_date):
    """The salary running on `on_date`, from an employee's rows for one office.

    Falls back to the most recent one that started on or before that date, so a
    year-end calculation uses the salary actually in force then — not whatever
    the employee happens to earn today.
    """
    candidates = [
        salary
        for salary in salaries
        if salary.effective_from <= on_date and (salary.effective_to is None or salary.effective_to >= on_date)
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda salary: salary.effective_from)


def aguinaldo_for(employee, salaries, year, today=None):
    """Aguinaldo owed to one employee for `year`, one row per (office, currency).

    LFT art. 87: at least 15 days of salary, proportional to time worked. The
    office sets the days — never below the legal floor, sometimes above.

    The salary used is the one in force at the *end* of the employee's year, so
    a December raise counts and a raise the following January does not.
    """
    worked = days_worked_in_year(employee, year)
    if worked == 0:
        return []

    year_end = date(year, 12, 31)
    reference_date = min(employee.termination_date or year_end, year_end)
    proportion = Decimal(worked) / DAYS_IN_YEAR

    by_office = {}
    for salary in salaries:
        by_office.setdefault(salary.office_id, []).append(salary)

    results = []
    for office_salaries in by_office.values():
        salary = salary_in_force(office_salaries, reference_date)
        if salary is None:
            continue
        days = salary.office.aguinaldo_days
        amount = salary.daily_amount() * Decimal(days) * proportion
        results.append(
            {
                "office_id": str(salary.office_id),
                "office_name": salary.office.name,
                "currency": salary.currency,
                "aguinaldo_days": days,
                "days_worked": worked,
                "daily_salary": str(_quantize(salary.daily_amount())),
                "amount": str(_quantize(amount)),
            }
        )
    return results


def annual_cost(employees_with_salaries, adjustments, year):
    """What the workforce costs for `year`, grouped by (office, currency).

    Salary is annualized from the rate in force, prorated by the days the person
    was actually on payroll — a hire in October costs three months, not twelve.
    Aguinaldo is added because it is a real yearly outlay, and adjustments move
    the total in their own direction (a debt is money coming back).
    """
    year_end = date(year, 12, 31)
    rows = {}

    def row_for(office_id, office_name, currency):
        key = (office_id, currency)
        if key not in rows:
            rows[key] = {
                "office_id": office_id,
                "office_name": office_name,
                "currency": currency,
                "salaries": Decimal(0),
                "aguinaldo": Decimal(0),
                "bonuses": Decimal(0),
                "support": Decimal(0),
                "debts": Decimal(0),
                "headcount": 0,
            }
        return rows[key]

    for employee, salaries in employees_with_salaries:
        worked = days_worked_in_year(employee, year)
        if worked == 0:
            continue
        proportion = Decimal(worked) / DAYS_IN_YEAR
        reference_date = min(employee.termination_date or year_end, year_end)

        by_office = {}
        for salary in salaries:
            by_office.setdefault(salary.office_id, []).append(salary)

        for office_salaries in by_office.values():
            salary = salary_in_force(office_salaries, reference_date)
            if salary is None:
                continue
            row = row_for(str(salary.office_id), salary.office.name, salary.currency)
            row["salaries"] += salary.annual_amount() * proportion
            row["aguinaldo"] += salary.daily_amount() * Decimal(salary.office.aguinaldo_days) * proportion
            row["headcount"] += 1

    for adjustment in adjustments:
        if adjustment.effective_date.year != year or adjustment.office_id is None:
            continue
        row = row_for(str(adjustment.office_id), adjustment.office.name, adjustment.currency)
        if adjustment.kind == "BONUS":
            row["bonuses"] += adjustment.amount
        elif adjustment.kind == "SUPPORT":
            row["support"] += adjustment.amount
        else:
            row["debts"] += adjustment.amount

    results = []
    for row in rows.values():
        total = row["salaries"] + row["aguinaldo"] + row["bonuses"] + row["support"] - row["debts"]
        results.append(
            {
                **{
                    key: str(_quantize(row[key]))
                    for key in ("salaries", "aguinaldo", "bonuses", "support", "debts")
                },
                "office_id": row["office_id"],
                "office_name": row["office_name"],
                "currency": row["currency"],
                "headcount": row["headcount"],
                "total": str(_quantize(total)),
            }
        )

    results.sort(key=lambda item: (item["office_name"], item["currency"]))
    return results
