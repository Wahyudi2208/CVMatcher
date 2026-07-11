export default function AnalysisResultEmptyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="rounded-xl p-10 text-center max-w-lg">
                <h1 className="text-2xl font-bold">
                    Belum Ada Riwayat Analisis
                </h1>

                <p className="mt-3 text-muted">
                    Anda belum pernah melakukan screening CV.
                    Silakan unggah CV terlebih dahulu.
                </p>
            </div>
        </div>
    );
}