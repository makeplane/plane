import { Rocket } from "lucide-react";
import { EUpdateStatus } from "@plane/types/src/enums";
import { TChartData } from "@plane/types";

export const overviewDummyData = {
    total_counts: [
        {
            label: "Total Users",
            count: 53,
            hike_percentage: -10,
            versus: "vs last month",
        },
        {
            label: "Total Admins",
            count: 23,
            hike_percentage: -3,
            versus: "vs last month",
        },
        {
            label: "Total Members",
            count: 62,
            hike_percentage: -8,
            versus: "vs last month",
        },
        {
            label: "Total Guests",
            count: 55,
            hike_percentage: 10,
            versus: "vs last month",
        },
        {
            label: "Total Projects",
            count: 112,
            hike_percentage: 10,
            versus: "vs last month",
        },
        {
            label: "Total Work Items",
            count: 512,
            hike_percentage: 10,
            versus: "vs last month",
        },
        {
            label: "Total Work Items",
            count: 53663,
            hike_percentage: 10,
            versus: "vs last month",
        },
        {
            label: "Total Intake",
            count: 2,
            hike_percentage: -9,
            versus: "vs last month",
        }
    ],
    active_projects: [
        {
            icon: Rocket,
            label: "Pulse",
            status: EUpdateStatus.ON_TRACK,
        },
        {
            icon: Rocket,
            label: "Plane Rocker",
            status: EUpdateStatus.OFF_TRACK,
        },
        {
            icon: Rocket,
            label: "Plane Rocker",
            status: EUpdateStatus.AT_RISK,
        },

    ],
    graph_data: [
        {
            entity: 'Work Item',
            count: 120,
            hike_percentage: 10,
        },
        {
            entity: 'Epics',
            count: 98,
            hike_percentage: -32,

        },
        {
            entity: 'Cycles',
            count: 86,
            hike_percentage: 43,
        },
        {
            entity: 'Modules',
            count: 99,
            hike_percentage: 9,
        },
        {
            entity: 'Views',
            count: 85,
            hike_percentage: 12,
        },
        {
            entity: 'Pages',
            count: 65,
            hike_percentage: -2,
        },
        {
            entity: 'Intake',
            count: 1,
            hike_percentage: -2,
        },
    ],
    lines: [
        {
            key: "active",
            label: "Active",
            dashedLine: false,
            fill: "#1192E8",
            stroke: "#1192E8",
            showDot: true,
            smoothCurves: false,
        },
        {
            key: "inactive",
            label: "Inactive",
            dashedLine: false,
            fill: "#FA4D56",
            stroke: "#FA4D56",
            showDot: true,
            smoothCurves: false,
        },
    ],
    line_data: [
        { name: "Jan", active: 240, inactive: 2400 },
        { name: "Feb", active: 300, inactive: 139 },
        { name: "Mar", active: 200, inactive: 980 },
        { name: "Apr", active: 278, inactive: 390 },
        { name: "May", active: 189, inactive: 480 },
        { name: "Jun", active: 239, inactive: 380 },
        { name: "Jul", active: 349, inactive: 430 },
    ],
    intake_lines: [
        {
            key: "accepted",
            label: "Accepted",
            dashedLine: false,
            fill: "#1192E8",
            stroke: "#1192E8",
            showDot: true,
            smoothCurves: false,
        },
        {
            key: "rejected",
            label: "Rejected",
            dashedLine: false,
            fill: "#FA4D56",
            stroke: "#FA4D56",
            showDot: true,
            smoothCurves: false,
        },
    ],
    intake_line_data: [
        { name: "Jan", accepted: 240, rejected: 2400 },
        { name: "Feb", accepted: 300, rejected: 139 },
        { name: "Mar", accepted: 200, rejected: 980 },
        { name: "Apr", accepted: 278, rejected: 390 },
        { name: "May", accepted: 189, rejected: 480 },
        { name: "Jun", accepted: 239, rejected: 380 },
        { name: "Jul", accepted: 349, rejected: 430 },
    ],
    bars: [
        {
            key: "draft",
            label: "Draft",
            fill: "#808080",
            stackId: "bar-one",
            textClassName: "",
        },
        {
            key: "planning",
            label: "Planning",
            fill: "#8A2BE2",
            stackId: "bar-one",
            textClassName: "",
        },
        {
            key: "executing",
            label: "Executing",
            fill: "#0066CC",
            stackId: "bar-one",
            textClassName: "",
        },
        {
            key: "monitoring",
            label: "Monitoring",
            fill: "#008080",
            stackId: "bar-one",
            textClassName: "",
        },
        {
            key: "completed",
            label: "Completed",
            fill: "#006400",
            stackId: "bar-one",
            textClassName: "",
        },
        {
            key: "cancelled",
            label: "Cancelled",
            fill: "#2F4F4F",
            stackId: "bar-one",
            textClassName: "",
        },

    ],
    bar_data: [
        { states: "Draft", draft: 40 },
        { states: "Planning", planning: 70 },
        { states: "Executing", executing: 40 },
        { states: "Monitoring", monitoring: 45 },
        { states: "Completed", completed: 25 },
        { states: "Cancelled", cancelled: 5 }
    ] as TChartData<string, string>[],
    work_bars: [
        {
            key: "urgent",
            label: "Urgent",
            fill: "#DC3545",  // Red color for urgent
            stackId: "bar-one",
            textClassName: "text-custom-text-200",
        },
        {
            key: "high",
            label: "High",
            fill: "#FF6B00",  // Orange color for high
            stackId: "bar-one",
            textClassName: "text-custom-text-200",
        },
        {
            key: "medium",
            label: "Medium",
            fill: "#F5C000",  // Yellow/Gold color for medium
            stackId: "bar-one",
            textClassName: "text-custom-text-200",
        },
        {
            key: "low",
            label: "Low",
            fill: "#00B8D9",  // Blue color for low
            stackId: "bar-one",
            textClassName: "text-custom-text-200",
        },
        {
            key: "none",
            label: "None",
            fill: "#808080",  // Gray color for none
            stackId: "bar-one",
            textClassName: "text-custom-text-200",
        },
    ],
    work_bar_data: [
        { states: "Urgent", urgent: 15 },
        { states: "High", high: 40 },
        { states: "Medium", medium: 60 },
        { states: "Low", low: 35 },
        { states: "None", none: 70 }
    ] as TChartData<string, string>[],
    work_areas: [
        {
            key: "resolved",
            label: "Resolved",
            fill: "#19803833",
            fillOpacity: 1,
            stackId: "bar-one",
            showDot: false,
            smoothCurves: true,
            strokeColor: "#198038",
            strokeOpacity: 1,
        },
        {
            key: "unresolved",
            label: "Unresolved",
            fill: "#1192E833",
            fillOpacity: 1,
            stackId: "bar-one",
            showDot: false,
            smoothCurves: true,
            strokeColor: "#1192E8",
            strokeOpacity: 1,
        },

    ],
    work_area_data: Array.from({ length: 10 }, (_, i) => ({
        resolved: Math.floor(Math.random() * 20),
        unresolved: Math.floor(Math.random() * 20),
    })),
    sampleScatterData: {
        data: [
            { x: 10, y: 20, z: 5, "epics": 15, "dashboard": 10 },
            { x: 15, y: 25, z: 8, "epics": 20, "dashboard": 12 },
            { x: 20, y: 30, z: 12, "epics": 25, "dashboard": 15 },
            { x: 25, y: 35, z: 15, "epics": 30, "dashboard": 18 },
            { x: 30, y: 40, z: 18, "epics": 35, "dashboard": 20 },
            { x: 35, y: 45, z: 22, "epics": 40, "dashboard": 22 },
            { x: 40, y: 50, z: 25, "epics": 45, "dashboard": 25 },
            { x: 45, y: 55, z: 28, "epics": 50, "dashboard": 28 },
            { x: 50, y: 60, z: 32, "epics": 55, "dashboard": 30 },
            { x: 55, y: 65, z: 35, "epics": 60, "dashboard": 32 },
        ],
        scatterPoints: [
            {
                key: "epics",
                label: "Epics",
                fill: "rgb(var(--color-primary-100))",
                stroke: "rgb(var(--color-primary-200))",
            },
            {
                key: "dashboard",
                label: "Dashboard",
                fill: "rgb(var(--color-secondary-100))",
                stroke: "rgb(var(--color-secondary-200))",
            },
        ],
        xAxis: {
            key: "x",
            label: "Timeline",
        },
        yAxis: {
            key: "y",
            label: "Completion",
            allowDecimals: false,
        },
        margin: {
            top: 0,
            right: -10,
            bottom: 70,
            left: -10,
        },
        legend: {
            align: "right",
            verticalAlign: "top",
            layout: "horizontal",
        },
        showTooltip: true,
    }

}