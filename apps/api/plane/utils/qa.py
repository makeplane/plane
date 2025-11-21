from plane.db.models import CaseReview, CaseReviewRecord, CaseReviewThrough, TestCase


def update_case_review_status(cr, crt, assignee_id=None):
    if cr.mode == CaseReview.ReviewMode.SINGLE:
        target_assignee_id = assignee_id or cr.assignees.values_list('id', flat=True).first()
        last_record = (
            CaseReviewRecord.objects
            .filter(crt=crt, assignee_id=target_assignee_id)
            .exclude(result=CaseReviewRecord.Result.SUGGEST)
            .order_by('-created_at')
            .first()
        )
        crt.result = last_record.result if last_record else CaseReviewThrough.Result.NOT_START
        crt.save()
    else:
        assignee_ids = list(cr.assignees.values_list('id', flat=True))
        if not assignee_ids:
            crt.result = CaseReviewThrough.Result.NOT_START
            crt.save()
        else:
            records = (
                CaseReviewRecord.objects
                .filter(crt=crt, assignee_id__in=assignee_ids)
                .exclude(result=CaseReviewRecord.Result.SUGGEST)
                .order_by('assignee_id', '-created_at')
            )
            last_by_assignee = {}
            for r in records:
                if r.assignee_id not in last_by_assignee:
                    last_by_assignee[r.assignee_id] = r.result

            any_fail = any(res == CaseReviewRecord.Result.FAIL for res in last_by_assignee.values())
            any_re_review = any(res == CaseReviewRecord.Result.RE_REVIEW for res in last_by_assignee.values())
            any_missing = any(aid not in last_by_assignee for aid in assignee_ids)
            all_pass = (not any_missing) and len(last_by_assignee) == len(assignee_ids) and all(
                res == CaseReviewRecord.Result.PASS for res in last_by_assignee.values()
            )

            if any_fail:
                crt.result = CaseReviewThrough.Result.FAIL
            elif any_re_review:
                crt.result = CaseReviewThrough.Result.RE_REVIEW
            elif any_missing:
                crt.result = CaseReviewThrough.Result.PROCESS
            elif all_pass:
                crt.result = CaseReviewThrough.Result.PASS
            else:
                crt.result = CaseReviewThrough.Result.PROCESS
            crt.save()

    through_results = set(
        CaseReviewThrough.objects.filter(review=cr).values_list('result', flat=True)
    )
    if (
            CaseReviewThrough.Result.NOT_START in through_results or
            CaseReviewThrough.Result.PROCESS in through_results or
            CaseReviewThrough.Result.RE_REVIEW in through_results
    ):
        cr.state = CaseReview.State.PROGRESS
    else:
        cr.state = CaseReview.State.COMPLETED
    cr.save()


def re_approval_case(case: TestCase):
    crts = CaseReviewThrough.objects.filter(case=case)
    for crt in crts:
        assignees = crt.review.assignees.values_list('id', flat=True)
        for assignee in assignees:
            record = CaseReviewRecord.objects.filter(
                result__in=[CaseReviewRecord.Result.PASS, CaseReviewRecord.Result.FAIL],
                assignee=assignee, crt=crt).first()
            if not record: continue
            CaseReviewRecord.objects.create(result=CaseReviewThrough.Result.RE_REVIEW, assignee=record.assignee,
                                            crt=crt, reason='用例内容变更')
        update_case_review_status(crt.review, crt)

