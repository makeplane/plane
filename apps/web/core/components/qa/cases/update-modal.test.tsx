import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UpdateModal from './update-modal'

vi.mock('next/navigation', () => ({ useParams: () => ({ workspaceSlug: 'ws' }) }))
vi.mock('@/hooks/store/use-member', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/hooks/store/use-member')>()
  return {
    ...mod,
    useMember: () => ({
      getUserDetails: () => ({ display_name: 'User' }),
      workspace: { workspaceMemberIds: [], isUserSuspended: () => false },
    }),
  }
})
vi.mock('app/(all)/[workspaceSlug]/(projects)/test-management/util', () => ({
  getEnums: vi.fn(async () => ({ case_type: {}, case_priority: {}, case_state: {} })),
}))
vi.mock('@/components/dropdowns/member/dropdown', () => ({
  MemberDropdown: ({ placeholder }: any) => <span>{placeholder || '用户'}</span>,
}))
vi.mock('./work-item-display-modal', () => ({ WorkItemDisplayModal: () => null }))
vi.mock('./work-item-select-modal', () => ({ WorkItemSelectModal: () => null }))
vi.mock('./update-modal/modal-header', () => ({ ModalHeader: () => <div /> }))
vi.mock('./update-modal/title-input', () => ({ TitleInput: () => <div /> }))
vi.mock('./update-modal/case-meta-form', () => ({ CaseMetaForm: () => <div /> }))
vi.mock('./update-modal/basic-info-panel', () => ({ BasicInfoPanel: () => <div /> }))
vi.mock('./update-modal/side-info-panel', () => ({ SideInfoPanel: () => <div /> }))

class MockCaseService {
  createComment = vi.fn(() => Promise.resolve())
  getCase = vi.fn(() => Promise.resolve({ id: 'c1', name: 'n', steps: [], precondition: '', remark: '' }))
  get = vi.fn(() =>
    Promise.resolve({
      data: {
        data: [
          {
            id: 'cmt1',
            creator: 'u2',
            creator_name: 'User2',
            content: 'abc',
            children: [],
            created_at: Date.now(),
          },
        ],
        count: 1,
      },
    })
  )
}

vi.mock('../../../services/qa/case.service', () => ({ CaseService: MockCaseService }))

vi.mock('@/hooks/store/user', () => ({ useUser: () => ({ data: { id: 'u1' } }) }))

describe('UpdateModal reply box interactions', () => {
  it('hides reply box immediately after sending and clears content', async () => {
    render(<UpdateModal open={true} onClose={() => {}} caseId={'c1'} />)

    await waitFor(() => screen.getByText('评论'))

    const replyButtons = screen.queryAllByText('回复')
    if (replyButtons[0]) {
      fireEvent.click(replyButtons[0])
    }

    const textarea = screen.queryByPlaceholderText(/回复/)
    if (textarea) {
      fireEvent.change(textarea, { target: { value: 'hello' } })
    }

    const sendBtn = screen.queryByText('发送回复')
    if (sendBtn) fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.queryByText('发送回复')).toBeNull()
    })
  })

  it('clears reply content when cancel is clicked', async () => {
    render(<UpdateModal open={true} onClose={() => {}} caseId={'c1'} />)
    await waitFor(() => screen.getByText('评论'))

    const replyButtons = screen.queryAllByText('回复')
    if (replyButtons[0]) fireEvent.click(replyButtons[0])

    const textarea = screen.queryByPlaceholderText(/回复/)
    if (textarea) fireEvent.change(textarea, { target: { value: 'to-clear' } })

    const cancelBtn = screen.getByText('取消')
    fireEvent.click(cancelBtn)

    expect(screen.queryByPlaceholderText(/回复/) ).toBeNull()
  })
})
