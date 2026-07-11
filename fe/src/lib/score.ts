export type ScoreTier = {
    label: string;
    labelColor: string;
    ringColor: string;
};

export function getTier(score: number): ScoreTier {

    if (score >= 85) {
        return {
            label: "Sangat Sesuai",
            labelColor: "text-green-600",
            ringColor: "#16a34a",
        };
    }

    if (score >= 70) {
        return {
            label: "Cukup Sesuai",
            labelColor: "text-yellow-500",
            ringColor: "#eab308",
        };
    }

    if (score >= 55) {
        return {
            label: "Kurang Sesuai",
            labelColor: "text-orange-500",
            ringColor: "#f97316",
        };
    }

    return {
        label: "Tidak Sesuai",
        labelColor: "text-red-600",
        ringColor: "#dc2626",
    };
}