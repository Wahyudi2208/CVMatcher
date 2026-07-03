import axios from 'axios'
import FormData from 'form-data'
import fs from 'fs'

export const analyzeBatchCV = async (
    cvs,
    jdText,
    jdTitle
) => {

    const form = new FormData()

    cvs.forEach(cv => {
        form.append(
            'cvs',
            fs.createReadStream(cv.filePath)
        )
    })

    form.append('jd_text', jdText)

    if (jdTitle) {
        form.append('jd_title', jdTitle)
    }

    const response = await axios.post(
        'http://localhost:8000/analyze/batch',
        form,
        {
            headers: form.getHeaders(),
            timeout: 120000
        }
    )

    return response.data
}