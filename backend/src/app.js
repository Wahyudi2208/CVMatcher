import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import profileRoutes from './routes/profileRoutes.js'

const app = express()

app.use(cors())
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
)
app.use(express.json())
app.use('/uploads', express.static('src/uploads'))
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/profile', profileRoutes)

app.get('/', (req, res) => {
  res.send('API Running...')
})

export default app