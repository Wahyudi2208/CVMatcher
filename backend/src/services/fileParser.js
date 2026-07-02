import fs from "fs";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

function cleanText(text) {
    return text
        .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
        .replace(/Page\s+\d+/gi, "")
        .replace(/\r/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

// PDF
export const parsePDF = async (filePath) => {
    const data = new Uint8Array(
        fs.readFileSync(filePath)
    );
    const pdf = await pdfjsLib.getDocument({
        data
    }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

        const page = await pdf.getPage(pageNum);
        const content =
            await page.getTextContent();
        const items = content.items;

        items.sort((a, b) => {
            const ay = a.transform[5];
            const by = b.transform[5];

            if (Math.abs(by - ay) > 2) {
                return by - ay;
            }
            return a.transform[4] - b.transform[4];
        });

        let lastY = null;

        for (const item of items) {
            const y = item.transform[5];
            if (
                lastY !== null &&
                Math.abs(lastY - y) > 5
            ) {
                fullText += "\n";
            }
            fullText += item.str + " ";
            lastY = y;
        }
        fullText += "\n\n";
    }
    return cleanText(fullText);
};

// Docx
export const parseDOCX = async (filePath) => {
    const result =
        await mammoth.extractRawText({
            path: filePath,
        });
    return cleanText(result.value);

};

// Main
export const parseFile = async (
    filePath,
    fileType
) => {
    switch (fileType) {
        case "pdf":
            return await parsePDF(filePath);
        case "docx":
            return await parseDOCX(filePath);
        default:
            throw new Error(
                `Unsupported file type: ${fileType}`
            );
    }
};