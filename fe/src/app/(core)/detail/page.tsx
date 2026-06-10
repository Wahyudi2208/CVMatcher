"use client";

const candidateData = {
    name: "Sari Dewi Kusuma",
    cvFile: "CV_Sari_Dewi.pdf",
    matchScore: 74,
    matchLabel: "Sangat Sesuai",
    skillsMatched: ["Vue.js", "JavaScript", "REST API", "MySQL"],
    skillsNotMatched: ["Vue.js", "JavaScript", "REST API", "MySQL"],
    cvContent: [
        "Sari Dewi Kusuma adalah seorang Frontend Developer dengan pengalaman 3 tahun dalam pengembangan aplikasi web menggunakan Vue.js dan JavaScript.",
        "Berpengalaman dalam membangun RESTful API integration dan bekerja dengan database MySQL untuk aplikasi skala menengah.",
        "Pernah bekerja di PT. Teknologi Maju sebagai Junior Frontend Developer selama 2 tahun, kemudian bergabung dengan startup lokal sebagai Mid-level Developer.",
        "Memiliki kemampuan komunikasi yang baik, terbiasa bekerja dalam tim Agile, dan mampu menyelesaikan proyek sesuai deadline.",
    ],
    summaryRecommendation: [
        "Kandidat memiliki kecocokan yang sangat baik dengan posisi yang dilamar, terutama pada skill teknis utama seperti Vue.js, JavaScript, dan MySQL.",
        "Pengalaman kerja kandidat relevan dengan kebutuhan tim dan menunjukkan pertumbuhan karir yang konsisten.",
        "Disarankan untuk melakukan technical interview lebih lanjut untuk menggali kemampuan problem-solving dan pengalaman proyek skala besar.",
        "Secara keseluruhan, kandidat ini sangat direkomendasikan untuk masuk ke tahap seleksi berikutnya.",
    ],
};

function CircularScore({ score, label }: { score: number; label: string }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-20 h-20 md:w-24 md:h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="7"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg md:text-xl font-bold text-gray-800">{score}%</span>
                </div>
            </div>
            <span className="text-sm font-semibold text-green-600">{label}</span>
        </div>
    );
}

function SkillBadge({
    skill,
    variant,
}: {
    skill: string;
    variant: "matched" | "unmatched";
}) {
    const base =
        "px-3 py-1 rounded-full text-sm font-medium border";
    const styles =
        variant === "matched"
            ? "bg-green-50 text-green-700 border-green-300"
            : "bg-red-50 text-red-600 border-red-300";
    return <span className={`${base} ${styles}`}>{skill}</span>;
}

export default function ResultDetailPage() {
    const data = candidateData;

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 font-sans">
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-start justify-between gap-6 px-8 py-8 border-b border-gray-100">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {data.name}
                            </h1>

                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-2">
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>

                                <span>{data.cvFile}</span>
                            </div>
                        </div>

                        <div className="shrink-0">
                            <CircularScore
                                score={data.matchScore}
                                label={data.matchLabel}
                            />
                        </div>
                    </div>

                    <div className="px-8 py-7 mt-3 border-b border-gray-100">
                        <h2 className="text-xs font-bold tracking-widest text-black uppercase mb-3">
                            Skill Sesuai
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {data.skillsMatched.map((skill) => (
                                <SkillBadge key={skill} skill={skill} variant="matched" />
                            ))}
                        </div>
                    </div>

                    <div className="px-8 py-7 mt-3 border-b border-gray-100">
                        <h2 className="text-xs font-bold tracking-widest text-black uppercase mb-3">
                            Skill Tidak Sesuai
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {data.skillsNotMatched.map((skill) => (
                                <SkillBadge key={skill} skill={skill} variant="unmatched" />
                            ))}
                        </div>
                    </div>

                    <div className="px-8 py-7 mt-3 border-b border-gray-100">
                        <h2 className="text-xs font-bold tracking-widest text-black uppercase mb-3">
                            Isi File CV
                        </h2>
                        <div className="flex flex-col gap-4">
                            {data.cvContent.map((line, i) => (
                                <p key={i} className="text-sm text-gray-700 leading-relaxed">
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>

                    <div className="px-8 py-7">
                        <h2 className="text-xs font-bold tracking-widest text-black uppercase mb-4">
                            Summary Recommendation
                        </h2>
                        <div className="flex flex-col gap-4">
                            {data.summaryRecommendation.map((line, i) => (
                                <p key={i} className="text-sm text-gray-700 leading-relaxed">
                                    {line}
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}