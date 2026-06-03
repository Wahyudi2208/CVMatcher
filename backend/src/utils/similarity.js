import natural from 'natural'

const tokenizer = new natural.WordTokenizer()

// Preprocess Text
const preprocess = (text) => {
    return tokenizer
        .tokenize(text.toLowerCase())
        .join(' ')
}

// Cosine Similarity
const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i]
        normA += vecA[i] * vecA[i]
        normB += vecB[i] * vecB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
        return 0
    }

    return dotProduct / (normA * normB)
}

// Main Similarity Function
export const calculateSimilarity = (
    jobText,
    cvText
) => {

    const tfidf = new natural.TfIdf()

    const processedJob = preprocess(jobText)
    const processedCV = preprocess(cvText)

    tfidf.addDocument(processedJob)
    tfidf.addDocument(processedCV)

    // Ambil semua term
    const terms = new Set()

    tfidf.listTerms(0).forEach(item => {
        terms.add(item.term)
    })

    tfidf.listTerms(1).forEach(item => {
        terms.add(item.term)
    })

    // Vector Job
    const jobVector = []

    // Vector CV
    const cvVector = []

    for (const term of terms) {
        jobVector.push(
            tfidf.tfidf(term, 0)
        )

        cvVector.push(
            tfidf.tfidf(term, 1)
        )
    }

    // Hitung cosine similarity
    const similarity = cosineSimilarity(
        jobVector,
        cvVector
    )

    // Return %
    return Number((similarity * 100).toFixed(2))
}