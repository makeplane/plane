/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { ChatOutline, MailOutline } from "@makeplane/propel/icons";
import { EProductSubscriptionEnum } from "@plane/types";
// plane imports
import { cn } from "@plane/utils";

export type TPlanFeatureData = React.ReactNode | boolean | null;

// TODO: we should change this type and use TProductSubscriptionType instead. Need changes in common constants.
export type TPlanePlans = "free" | "one" | "pro" | "business" | "enterprise";

export type TPlanDetail = {
  id: EProductSubscriptionEnum;
  name: React.ReactNode;
  monthlyPrice?: number;
  yearlyPrice?: number;
  monthlyPriceSecondaryDescription?: React.ReactNode;
  yearlyPriceSecondaryDescription?: React.ReactNode;
  buttonCTA?: React.ReactNode;
  isActive: boolean;
};

type TPlanFeatureDetails = {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  selfHostedDescription?: React.ReactNode;
  comingSoon?: boolean;
  selfHostedOnly?: boolean;
  cloud: Record<TPlanePlans, TPlanFeatureData>;
  "self-hosted"?: Record<TPlanePlans, TPlanFeatureData>;
};

type TPlansComparisonDetails = {
  id: string;
  title: React.ReactNode;
  comingSoon?: boolean;
  cloudOnly?: boolean;
  selfHostedOnly?: boolean;
  features: TPlanFeatureDetails[];
};

type PlanePlans = {
  planDetails: Record<TPlanePlans, TPlanDetail>;
  planHighlights: Record<TPlanePlans, string[]>;
  planComparison: TPlansComparisonDetails[];
};

function ForumIcon({ className }: { className?: string }) {
  return <ChatOutline className={cn(className, "size-5 text-secondary")} />;
}

export function ComingSoonBadge({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        "w-fit rounded-sm bg-accent-primary px-1.5 py-0.5 text-9 font-semibold whitespace-nowrap text-on-color",
        className
      )}
    >
      {t("common.coming_soon")}{" "}
    </span>
  );
}

export const PLANS_LIST: TPlanePlans[] = ["free", "one", "pro", "business", "enterprise"];

export function usePlanePlans() {
  const { t } = useTranslation();

  const PLANS_COMPARISON_LIST: TPlansComparisonDetails[] = [
    {
      id: "project-work-tracking",
      title: t("web_ui.project_work_tracking"),
      features: [
        {
          id: "projects",
          title: t("projects"),
          description: t("web_ui.add_projects_to_house_work_items_cycles_and_modules"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "issues",
          title: t("issues"),
          description: t("web_ui.add_work_via_work_items_set_properties_for_tracking_and_add_to_cycles_or_modules"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "comments",
          title: t("comments"),
          description: t("web_ui.respond_to_work_items_mention_members_and_brainstorm_together_without_leaving_plane"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "cycles",
          title: t("cycles"),
          description: t("web_ui.track_work_in_timeboxes_with_differing_frequency"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "modules",
          title: t("modules"),
          description: t("web_ui.group_replicable_work_in_modules_with_their_own_leads"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "intake",
          title: t("intake"),
          description: t(
            "web_ui.see_suggestions_and_feedback_from_viewers_and_guests_before_you_decide_to_add_them_to_your"
          ),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "common.estimates",
          title: t("common.estimates"),
          description: t("web_ui.measure_effort_in_points_in_a_system_that_works_for_you"),
          cloud: {
            free: "Basic",
            one: "Basic",
            pro: "Advanced",
            business: "Advanced",
            enterprise: "Advanced",
          },
        },
      ],
    },
    {
      id: "project-work-management",
      title: t("web_ui.project_work_management"),
      features: [
        {
          id: "web_ui.bulk_ops",
          title: t("web_ui.bulk_ops"),
          description: t("web_ui.add_several_work_items_to_cycles_or_modules_transfer_them_or_edit_their_properties"),
          cloud: {
            free: false,
            one: "Limited props",
            pro: "All props",
            business: (
              <span className="flex flex-col items-end gap-1 lg:items-center">
                <ComingSoonBadge />
                {t("web_ui.work_item_transfers_and_conversions")}{" "}
              </span>
            ),
            enterprise: (
              <span className="flex flex-col items-end gap-1 lg:items-center">
                <ComingSoonBadge />
                {t("web_ui.work_item_transfers_and_conversions")}{" "}
              </span>
            ),
          },
        },
        {
          id: "web_ui.time_tracking_worklogs",
          title: t("web_ui.time_tracking_worklogs"),
          description: t("web_ui.track_time_per_work_item_see_aggregated_reports_and_filter_by_need"),
          cloud: {
            free: false,
            one: "Basic",
            pro: "Historical timesheets",
            business: "Historical timesheets\nand approvals",
            enterprise: "Historical timesheets\nand approvals",
          },
        },
        {
          id: "active_cycles",
          title: t("active_cycles"),
          description: t("web_ui.see_all_running_cycles_across_all_projects_or_soon_in_a_single_project"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "work_item_types.label",
          title: t("work_item_types.label"),
          description: t("web_ui.create_your_own_work_item_types_with_your_own_properties"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "common.custom_properties",
          title: t("common.custom_properties"),
          description: t("web_ui.create_your_own_properties_and_apply_them_to_your_workspace_or_project"),
          cloud: {
            free: false,
            one: false,
            pro: "Project-level\ncustom properties",
            business: "Workspace-level\nproperties and roll-ups",
            enterprise: "Workspace-level\nproperties and roll-ups",
          },
        },
        {
          id: "web_ui.dependencies_in_gantt",
          title: t("web_ui.dependencies_in_gantt"),
          description: t("web_ui.adjust_timelines_for_dependent_work_items_visually_on_our_gantt_layout"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.work_item_transfers",
          title: t("web_ui.work_item_transfers"),
          description: t("web_ui.move_a_work_item_from_a_project_or_a_cycle_to_another"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.auto_transfer_cycle_work_items",
          title: t("web_ui.auto_transfer_cycle_work_items"),
          description: t(
            "web_ui.transfer_incomplete_work_items_from_a_completed_cycle_to_the_next_cycle_or_to_the_default_"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "common.epics",
          title: t("common.epics"),
          description: t("web_ui.organize_long_term_work_in_epics_that_house_work_items_cycles_and_modules"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.initiatives",
          title: t("web_ui.initiatives"),
          description: t("web_ui.create_initiatives_to_roll_up_several_epics"),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.checkpoints",
          title: t("web_ui.checkpoints"),
          description: t(
            "web_ui.add_markers_to_projects_epics_and_initiatives_to_keep_your_team_on_track_and_report_on_pro"
          ),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.module_overview",
          title: t("web_ui.module_overview"),
          description: t("web_ui.like_cycle_overviews_see_relevant_details_and_progress_charts_for_each_module"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.auto_assignment_in_modules",
          title: t("web_ui.auto_assignment_in_modules"),
          description: t(
            "web_ui.choose_assignment_rules_for_work_items_in_a_module_including_linear_round_robin_or_capacit"
          ),
          cloud: {
            free: false,
            one: false,
            pro: "Linear",
            business: "Round-robin and Capacity",
            enterprise: "Round-robin and Capacity",
          },
        },
        // {
        //   title: "Project Overview",
        //   description: "See just-in-time snapshots of your project with\nessential metrics.",
        //   comingSoon: true,
        //   cloud: {
        //     free: false,
        //     one: false,
        //     pro: true,
        //     business: true,
        //     enterprise: true,
        //   },
        // },
        {
          id: "web_ui.public_private_and_secret_projects",
          title: t("web_ui.public_private_and_secret_projects"),
          description: t(
            "web_ui.public_projects_are_visible_and_accessible_to_everyone_private_ones_are_visible_but_need_a"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.state_of_projects",
          title: t("web_ui.state_of_projects"),
          description: t(
            "web_ui.see_all_projects_laid_across_states_that_highlight_those_that_need_attention_and_those_on_"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        // {
        //   title: "Project Updates",
        //   description:
        //     "Keep stakeholders in the loop with a dedicated\nspace for updates that everyone in the project can\nsee.",
        //   comingSoon: true,
        //   cloud: {
        //     free: false,
        //     one: false,
        //     pro: true,
        //     business: true,
        //     enterprise: true,
        //   },
        // },
        {
          id: "web_ui.pre_defined_work_item_templates",
          title: t("web_ui.pre_defined_work_item_templates"),
          description: t(
            "web_ui.choose_from_our_available_work_item_templates_that_customize_work_item_types_and_propertie"
          ),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.teamspace_cycles",
          title: t("web_ui.teamspace_cycles"),
          description: t("web_ui.see_multiple_cycles_in_multiple_projects_at_once"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "templates.settings.options.project.label",
          title: t("templates.settings.options.project.label"),
          description: t("web_ui.save_states_workflows_automation_and_other_project_settings_into_templates"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.baselines_and_deviations",
          title: t("web_ui.baselines_and_deviations"),
          description: t("web_ui.declare_baselines_for_how_your_projects_progress_and_zoom_in_on_deviations"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.scheduled_comms",
          title: t("web_ui.scheduled_comms"),
          description: t("web_ui.schedule_reports_notifications_and_messages_to_third_party_tools"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.intake_assignees",
          title: t("web_ui.intake_assignees"),
          description: t("web_ui.assign_approved_intake_work_items_to_a_member_by_default"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.custom_slas",
          title: t("web_ui.custom_slas"),
          description: t("web_ui.set_sla_matrices_for_time_sensitive_work_items"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.intake_forms",
          title: t("web_ui.intake_forms"),
          description: t("web_ui.take_intake_work_items_from_externally_accessible_web_forms"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.emails_for_intake",
          title: t("web_ui.emails_for_intake"),
          description: t("web_ui.get_an_email_address_for_reporting_work_items_directly_into_a_project_s_intake"),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
      ],
    },
    {
      id: "visualization",
      title: t("web_ui.visualization"),
      features: [
        {
          id: "web_ui.layouts",
          title: t("web_ui.layouts"),
          description: t(
            "web_ui.choose_from_the_list_the_board_the_calendar_the_gantt_or_the_spreadsheet_layout_for_your_w"
          ),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "views",
          title: t("views"),
          description: t("web_ui.save_sort_filter_and_display_options_on_a_layout_to_a_view"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.shared_views",
          title: t("web_ui.shared_views"),
          description: t("web_ui.choose_a_few_members_to_share_a_view_with"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.publish_views",
          title: t("web_ui.publish_views"),
          description: t("web_ui.put_a_view_on_the_internet_and_let_your_customers_interact_with_them"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.dashboards_and_widgets",
          title: t("web_ui.dashboards_and_widgets"),
          description: t("web_ui.create_your_own_dashboards_with_custom_widgets_and_data_types"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
      ],
    },
    {
      id: "analytics-reports",
      title: t("web_ui.analytics_reports"),
      features: [
        {
          id: "web_ui.progress_charts",
          title: t("web_ui.progress_charts"),
          description: t(
            "web_ui.track_progress_in_cycles_modules_and_overviews_throughout_plane_without_switching_to_dashb"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.cycle_reports",
          title: t("web_ui.cycle_reports"),
          description: t(
            "web_ui.get_on_demand_cycle_reports_during_and_after_a_cycle_revisit_reports_anytime_from_permalin"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.insights",
          title: t("web_ui.insights"),
          description: t("web_ui.hindsight_on_demand_insights_foresights"),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        // {
        //   title: "Time Capsule",
        //   description: "Go back in your project's timeline and see point-in-\ntime snapshots.",
        //   comingSoon: true,
        //   cloud: {
        //     free: false,
        //     one: false,
        //     pro: false,
        //     business: true,
        //     enterprise: true,
        //   },
        // },
        {
          id: "web_ui.advanced_pages_analytics",
          title: t("web_ui.advanced_pages_analytics"),
          description: t("web_ui.see_who_s_viewing_sharing_and_commenting_on_your_pages_along_with_other_useful_info"),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.custom_reports",
          title: t("web_ui.custom_reports"),
          description: t("web_ui.generate_reports_by_any_dimension_and_metric_across_your_project_or_workspace"),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
      ],
    },
    {
      id: "navigation",
      title: t("web_ui.navigation"),
      features: [
        {
          id: "Power K",
          title: "Power K",
          description: t("web_ui.access_a_keyboard_first_gateway_to_almost_anything_in_plane"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        // {
        //   title: "Search",
        //   description: "Search via natural-language queries, operators, or\nPQL",
        //   cloud: {
        //     free: "Basic text search",
        //     one: "Basic text search",
        //     pro: (
        //       <span className="flex flex-col items-end lg:items-center gap-1">
        //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
        //           COMING SOON
        //         </span>
        //         Operator capsules from text or PQL
        //       </span>
        //     ),
        //     business: (
        //       <span className="flex flex-col items-end lg:items-center gap-1">
        //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
        //           COMING SOON
        //         </span>
        //         Operator capsules from text or PQL
        //       </span>
        //     ),
        //     enterprise: (
        //       <span className="flex flex-col items-end lg:items-center gap-1">
        //         <span className="bg-[#3f76ff] text-on-color font-semibold text-9 p-0.5 w-fit whitespace-nowrap rounded-xs">
        //           COMING SOON
        //         </span>
        //         Operator capsules from text or PQL
        //       </span>
        //     ),
        //   },
        // },
        {
          id: "PQL",
          title: "PQL",
          description: t(
            "web_ui.write_plane_query_language_in_search_with_support_for_boolean_operators_soon_you_can_write"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
      ],
    },
    {
      id: "workspace-user-management",
      title: t("web_ui.workspace_and_user_management"),
      features: [
        {
          id: "web_ui.member_limit",
          title: t("web_ui.member_limit"),
          description: t("web_ui.number_of_seats_that_can_use_project_and_work_management_features"),
          selfHostedDescription: "Number of users that our standard infra supports\nIncrease infra to get more users",
          cloud: {
            free: "12",
            one: "",
            pro: "Unlimited",
            business: "Unlimited",
            enterprise: "Unlimited",
          },
          "self-hosted": {
            free: "~50",
            one: "~50",
            pro: "~200",
            business: "~200",
            enterprise: "Unlimited",
          },
        },
        {
          id: "web_ui.roles",
          title: t("web_ui.roles"),
          description: t("web_ui.choose_from_one_of_four_pre_defined_roles_or_create_custom_ones_with_rbac"),
          cloud: {
            free: "Basic",
            one: "Basic",
            pro: "Pre-defined roles",
            business: "RBAC",
            enterprise: "GAC",
          },
        },
        {
          id: "common.guests",
          title: t("common.guests"),
          description: t("web_ui.let_some_users_see_everything_or_just_their_work_items_in_a_project"),
          cloud: {
            free: false,
            one: "5 per paid member",
            pro: "5 per paid member",
            business: "5 per paid member",
            enterprise: "5 per paid member",
          },
        },
        {
          id: "web_ui.approvals",
          title: t("web_ui.approvals"),
          description: t("web_ui.set_workspace_project_and_work_item_type_approvals_to_designated_admins"),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.admin_interface",
          title: t("web_ui.admin_interface"),
          description: t("web_ui.get_an_admin_overview_to_manage_workspace_and_project_settings"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.workspace_activity_logs",
          title: t("web_ui.workspace_activity_logs"),
          description: t("web_ui.see_filterable_activity_logs_for_your_entire_workspace"),
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.api_enabled_audit_logs",
          title: t("web_ui.api_enabled_audit_logs"),
          description: t(
            "web_ui.see_a_full_workspace_audit_log_and_use_apis_to_flag_plane_activity_in_compliance_systems"
          ),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
      ],
    },
    {
      id: "automations-workflows",
      title: t("web_ui.automations_and_workflows"),
      features: [
        {
          id: "web_ui.trigger_and_action",
          title: t("web_ui.trigger_and_action"),
          description: t("web_ui.choose_a_trigger_and_a_corresponding_action_per_automation_flow"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.decisions_and_loops_automation",
          title: t("web_ui.decisions_and_loops_automation"),
          description: t("web_ui.use_actions_as_triggers_indefinitely_in_an_automation_flow"),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.number_of_automations",
          title: t("web_ui.number_of_automations"),
          description: t("web_ui.total_number_of_automation_flows_in_your_workspace"),
          cloud: {
            free: false,
            one: false,
            pro: "5,000",
            business: "10,000",
            enterprise: "Unlimited",
          },
        },
      ],
    },
    {
      id: "knowledge-management",
      title: t("web_ui.knowledge_management"),
      features: [
        {
          id: "pages",
          title: t("pages"),
          description: t("web_ui.build_knowledge_bases_for_your_teams_which_are_accessible_shareable"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.real_time_collab",
          title: t("web_ui.real_time_collab"),
          description: t("web_ui.edit_a_page_together_with_members_in_your_project_team_or_workspace"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.work_item_embeds",
          title: t("web_ui.work_item_embeds"),
          description: t("web_ui.embed_work_items_from_any_project_you_are_a_member_of"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.link_to_work_items",
          title: t("web_ui.link_to_work_items"),
          description: t("web_ui.link_pages_in_work_items_in_a_separate_section_in_work_item_details"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "publish",
          title: t("publish"),
          description: t(
            "web_ui.put_your_pages_on_the_web_for_external_users_and_let_them_comment_without_signing_into_you"
          ),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.wiki",
          title: t("web_ui.wiki"),
          description: t("web_ui.create_company_wide_wikis_or_knowledge_bases_without_creating_a_project"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "workspace_settings.settings.exports.title",
          title: t("workspace_settings.settings.exports.title"),
          description: t("web_ui.export_page_content_into_pdfs_or_word_compatible_docs"),
          cloud: {
            free: false,
            one: false,
            pro: "One download\nat a time",
            business: "Queued downloads",
            enterprise: "Queued downloads",
          },
        },
        {
          id: "common.templates",
          title: t("common.templates"),
          description: t("web_ui.use_pages_as_templates_for_your_project_team_or_workspace"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.versions",
          title: t("web_ui.versions"),
          description: t("web_ui.see_restorable_version_of_edits_to_your_pages"),
          cloud: {
            free: false,
            one: false,
            pro: "2 days",
            business: "3 months",
            enterprise: "Unlimited",
          },
        },
        {
          id: "web_ui.databases_formulas",
          title: t("web_ui.databases_formulas"),
          description: t(
            "web_ui.put_databases_and_formulas_into_a_page_without_worrying_about_losing_text_images_or_other_"
          ),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "wiki.upgrade_flow.tabs.nested_pages",
          title: t("wiki.upgrade_flow.tabs.nested_pages"),
          description: t(
            "web_ui.pages_inside_a_page_organize_your_pages_as_you_see_fit_for_the_progressive_disclosure"
          ),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: "Word-compatible + other format downloads",
            enterprise: "Word-compatible + other format downloads",
          },
        },
      ],
    },
    {
      id: "importers",
      title: t("web_ui.importers"),
      features: [
        {
          id: "Jira",
          title: "Jira",
          description: t("web_ui.import_your_work_items_and_members_from_jira"),
          cloud: {
            free: "Without custom props",
            one: "Without custom props",
            pro: "With custom props",
            business: "With custom props",
            enterprise: "With custom props",
          },
        },
        {
          id: "GitHub",
          title: "GitHub",
          description: t("web_ui.import_your_work_items_and_members_from_github"),
          cloud: {
            free: "Without custom props",
            one: "Without custom props",
            pro: "With custom props",
            business: "With custom props",
            enterprise: "With custom props",
          },
        },
      ],
    },
    {
      id: "integrations",
      title: t("integrations.integrations"),
      comingSoon: true,
      features: [
        {
          id: "GitHub",
          title: "GitHub",
          description: t(
            "web_ui.sync_plane_work_items_and_states_to_github_work_items_and_states_update_github_automatical"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "Slack",
          title: "Slack",
          description: t("web_ui.get_plane_activity_in_slack_and_use_commands_in_slack_to_make_changes_in_plane"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "Zapier",
          title: "Zapier",
          description: t("web_ui.run_if_then_else_automations_using_zapier"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "Zendesk",
          title: "Zendesk",
          description: t("web_ui.create_plane_work_items_from_zendesk_tickets"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "Freshdesk",
          title: "Freshdesk",
          description: t("web_ui.create_plane_work_items_from_freshdesk_tickets"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
      ],
    },
    {
      id: "storage",
      title: t("web_ui.storage"),
      cloudOnly: true,
      features: [
        {
          id: "web_ui.space",
          title: t("web_ui.space"),
          description: t("web_ui.total_storage_allowed_per_workspace"),
          cloud: {
            free: "5GB",
            one: false,
            pro: "1 TB",
            business: "5 TB",
            enterprise: "Custom",
          },
        },
        {
          id: "web_ui.max_file_size",
          title: t("web_ui.max_file_size"),
          description: t("web_ui.limit_for_uploads_to_your_workspace"),
          cloud: {
            free: "5 MB",
            one: false,
            pro: "100 MB",
            business: "200 MB",
            enterprise: "Custom",
          },
        },
      ],
    },
    {
      id: "security",
      title: t("security"),
      features: [
        {
          id: "SAML",
          title: "SAML",
          description: t("web_ui.get_the_officially_supported_saml_implementation_and_make_plane_secure_with_any_idp"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "OIDC",
          title: "OIDC",
          description: t("web_ui.get_the_officially_supported_oidc_implementation_and_make_plane_secure_with_any_idp"),
          selfHostedOnly: true,
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.domain_security",
          title: t("web_ui.domain_security"),
          description: t(
            "web_ui.choose_other_domains_that_can_authenticate_into_your_plane_workspace_or_restrict_all_but_o"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.two_factor_authentication_and_passkeys",
          title: t("web_ui.two_factor_authentication_and_passkeys"),
          description: t(
            "web_ui.secure_your_plane_workspace_with_device_dependent_two_factor_authentication_and_passkeys"
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.password_policy",
          title: t("web_ui.password_policy"),
          description: t("web_ui.set_custom_password_policies_in_line_with_your_compliance_requirements"),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "LDAP",
          title: "LDAP",
          description: t(
            "web_ui.get_our_official_ldap_implementation_and_secure_your_plane_workspace_with_your_ldap_server"
          ),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: false,
            enterprise: true,
          },
        },
      ],
    },
    {
      id: "self-hosted",
      title: t("web_ui.self_hosted"),
      selfHostedOnly: true,
      features: [
        {
          id: "web_ui.god_mode",
          title: t("web_ui.god_mode"),
          description: t("web_ui.manage_your_self_hosted_plane_instance_better_with_an_instance_admin_interface"),
          cloud: {
            free: true,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.one_click_deployment",
          title: t("web_ui.one_click_deployment"),
          description: t(
            "web_ui.install_and_deploy_your_self_hosted_plane_to_any_private_cloud_with_a_single_line_command"
          ),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.digital_ocean_marketplace_app",
          title: t("web_ui.digital_ocean_marketplace_app"),
          description: t("web_ui.get_our_digital_ocean_compatible_app_on_their_marketplace"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.heroku_platform_app",
          title: t("web_ui.heroku_platform_app"),
          description: t("web_ui.get_our_heroku_platform_compatible_app_and_deploy_to_heroku_easily"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "AWS AMI",
          title: "AWS AMI",
          description: t("web_ui.get_our_ami_compatible_app_from_the_aws_marketplace"),
          cloud: {
            free: false,
            one: true,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
        {
          id: "web_ui.private_deployments",
          title: t("web_ui.private_deployments"),
          description: t("web_ui.get_our_hosted_cloud_app_on_a_private_cloud_managed_by_us"),
          comingSoon: true,
          cloud: {
            free: false,
            one: false,
            pro: false,
            business: false,
            enterprise: true,
          },
        },
      ],
    },
    {
      id: "support",
      title: t("support"),
      features: [
        {
          id: "web_ui.channels",
          title: t("web_ui.channels"),
          description: t("web_ui.get_access_to_one_or_more_support_channels_by_your_plan"),
          cloud: {
            free: (
              <>
                <ForumIcon className="size-4" />
              </>
            ),
            one: (
              <div className="flex items-center gap-1">
                <MailOutline className="size-4 flex-shrink-0" />
                <ForumIcon className="size-4 flex-shrink-0" />
              </div>
            ),
            pro: (
              <div className="flex items-center gap-1">
                <MailOutline className="size-4 flex-shrink-0" />
                <ForumIcon className="size-4 flex-shrink-0" />
                <ChatOutline className="size-4 flex-shrink-0" />
              </div>
            ),
            business: "Full-suite\nprofessional services",
            enterprise: "Full-suite\nprofessional services",
          },
        },
        {
          id: "SLA",
          title: "SLA",
          description: (
            <>
              {t("web_ui.get_business_friendly_slas_with_higher_plans_slas_are_by_priority_of_work_item_and_tiers")}{" "}
              <a href="https://plane.so/talk-to-sales" target="_blank" rel="noopener noreferrer" className="underline">
                {t("web_ui.can_be_requested")}{" "}
              </a>
              .
            </>
          ),
          cloud: {
            free: false,
            one: false,
            pro: true,
            business: true,
            enterprise: true,
          },
        },
      ],
    },
  ];

  const PLANE_PLANS: PlanePlans = {
    planDetails: {
      free: {
        id: EProductSubscriptionEnum.FREE,
        name: "Free",
        monthlyPrice: 0,
        yearlyPrice: 0,
        isActive: true,
      },
      one: {
        id: EProductSubscriptionEnum.ONE,
        name: "One",
        monthlyPrice: 799,
        yearlyPrice: 799,
        monthlyPriceSecondaryDescription: "per workspace",
        yearlyPriceSecondaryDescription: "per workspace",
        buttonCTA: "Upgrade",
        isActive: false,
      },
      pro: {
        id: EProductSubscriptionEnum.PRO,
        name: "Pro",
        monthlyPrice: 8,
        yearlyPrice: 6,
        monthlyPriceSecondaryDescription: "billed monthly",
        yearlyPriceSecondaryDescription: "billed yearly",
        buttonCTA: "Upgrade",
        isActive: true,
      },
      business: {
        id: EProductSubscriptionEnum.BUSINESS,
        name: "Business",
        monthlyPriceSecondaryDescription: "billed monthly",
        yearlyPriceSecondaryDescription: "billed yearly",
        buttonCTA: "Talk to Sales",
        isActive: false,
      },
      enterprise: {
        id: EProductSubscriptionEnum.ENTERPRISE,
        name: "Enterprise",
        monthlyPriceSecondaryDescription: "billed monthly",
        yearlyPriceSecondaryDescription: "billed yearly",
        buttonCTA: "Talk to Sales",
        isActive: false,
      },
    },
    planHighlights: {
      free: ["Upto 12 users", "Pages", "Unlimited projects", "Unlimited cycles and modules"],
      one: ["Upto 50 users", "OIDC and SAML", "Active cycles", "Limited time tracking"],
      pro: ["Unlimited users", "Custom work items + Properties", "Work item templates", "Full Time Tracking"],
      business: ["RBAC", "Project Templates", "Baselines And Deviations", "Custom Reports"],
      enterprise: ["Private + managed deployments", "GAC", "LDAP support", "Databases + Formulas"],
    },
    planComparison: PLANS_COMPARISON_LIST,
  };

  return PLANE_PLANS;
}
