import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Unauthorized'
            })
        }

        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded
        if (!decoded.id) {
            return res.status(401).json({
                message: 'Token tidak valid'
            })
        }

        next()
    } catch (error) {
        return res.status(401).json({
            message: 'Token tidak valid'
        })
    }
}

export const uploadAuth = (req, res, next) => {
    req.user = null
    try {
        const authHeader = req.headers.authorization

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1]
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = decoded
        }

        next()
    } catch (error) {
        next()
    }
}