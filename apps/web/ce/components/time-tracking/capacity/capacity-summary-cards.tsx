import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import { eachDayOfInterval, parseISO, format } from "date-fns";
import type { ICapacityMember } from "@plane/types";

interface ICapacitySummaryCardsProps {
    totalLoggedMinutes: number;
    totalEstimatedMinutes: number;
    members: ICapacityMember[];
    dateFrom: string;
    dateTo: string;
}

export const CapacitySummaryCards = observer((props: ICapacitySummaryCardsProps) => {
    const { totalLoggedMinutes, totalEstimatedMinutes, members, dateFrom, dateTo } = props;
    const { t } = useTranslation();

    const formatHours = (minutes: number) => (minutes / 60).toFixed(1);

    // Compute Burndown Data
    const days = (!dateFrom || !dateTo) ? [] : eachDayOfInterval({ start: parseISO(dateFrom), end: parseISO(dateTo) });
    const burndownData: any[] = [];
    let remaining = totalEstimatedMinutes;

    for (const day of days) {
        const dateStr = format(day, "yyyy-MM-dd");
        let loggedThisDay = 0;
        for (const m of members) {
            if (m.days && m.days[dateStr]) {
                loggedThisDay += m.days[dateStr];
            }
        }
        remaining -= loggedThisDay;
        if (remaining < 0) remaining = 0;

        burndownData.push({
            name: format(day, "MMM dd"),
            Remaining: +(remaining / 60).toFixed(1),
            Logged: +(loggedThisDay / 60).toFixed(1),
        });
    }

    // Pie chart distribution - mock based on standard labels since capacity.py does not have issue group yet
    const pieData = [
        { name: "Development", value: 65 },
        { name: "Meeting", value: 15 },
        { name: "Design", value: 10 },
        { name: "Bug Fixing", value: 10 },
    ];
    const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div className="flex flex-col gap-4">
                <div className="group relative flex flex-col justify-center rounded-xl overflow-hidden border border-subtle bg-gradient-to-br from-surface-1 to-surface-2 p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 h-full">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-accent-primary/5 rounded-bl-[80px] transition-all group-hover:bg-accent-primary/10" />
                    <span className="text-[10px] tracking-wider font-semibold uppercase text-tertiary">
                        {t("capacity_total_logged")}
                    </span>
                    <span className="text-2xl font-bold text-primary mt-2 tracking-tight">
                        {formatHours(totalLoggedMinutes)}
                        <span className="text-sm font-medium text-secondary/60 ml-0.5">h</span>
                    </span>
                </div>

                <div className="group relative flex flex-col justify-center rounded-xl overflow-hidden border border-subtle bg-gradient-to-br from-surface-1 to-surface-2 p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 h-full">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-color-warning/5 rounded-bl-[80px] transition-all group-hover:bg-color-warning/10" />
                    <span className="text-[10px] tracking-wider font-semibold uppercase text-tertiary">
                        {t("capacity_total_estimated")}
                    </span>
                    <span className="text-2xl font-bold text-primary mt-2 tracking-tight">
                        {formatHours(totalEstimatedMinutes)}
                        <span className="text-sm font-medium text-secondary/60 ml-0.5">h</span>
                    </span>
                </div>
            </div>

            <div className="rounded-xl border border-subtle bg-gradient-to-b from-surface-1 to-surface-2 p-5 flex flex-col items-center col-span-1 shadow-sm hover:shadow-md transition-all duration-300">
                <span className="text-[10px] font-bold tracking-wide uppercase text-tertiary self-start mb-4">
                    Category Distribution
                </span>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', fontSize: '11px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-secondary mt-2">
                    {pieData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            {entry.name}
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-subtle bg-gradient-to-b from-surface-1 to-surface-2 p-5 flex flex-col items-center col-span-1 md:col-span-2 lg:col-span-2 shadow-sm hover:shadow-md transition-all duration-300 min-h-[300px]">
                <span className="text-[10px] font-bold tracking-wide uppercase text-tertiary self-start mb-4">
                    Time Burndown
                </span>
                <div className="w-full flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={burndownData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-subtle)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} dy={8} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-text-secondary)" }} dx={-8} />
                            <RechartsTooltip
                                contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-subtle)', borderRadius: '6px', fontSize: '11px' }}
                                itemStyle={{ color: 'var(--color-text-primary)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
                            <Line type="monotone" dataKey="Remaining" stroke="var(--color-primary-100)" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="Logged" stroke="var(--color-success-100)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
});
