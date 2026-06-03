import fs from 'fs'
import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'

// Parse PDF
export const parsePDF = async (filePath) => {
    const dataBuffer = fs.readFileSync(filePath)

    const parser = new PDFParse({ data: dataBuffer })

    await parser.load()
    const result = await parser.getText()

    return result.text
}

// Parse DOCX
export const parseDOCX = async (filePath) => {
    const result = await mammoth.extractRawText({
        path: filePath
    })

    return result.value
}

// Main parser
export const parseFile = async (filePath, fileType) => {
    switch (fileType) {
        case 'pdf':
            return await parsePDF(filePath)

        case 'docx':
            return await parseDOCX(filePath)

        default:
            throw new Error(`Unsupported file type: ${fileType}`)
    }
}