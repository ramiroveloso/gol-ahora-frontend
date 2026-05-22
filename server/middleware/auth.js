import jwt from 'jsonwebtoken'

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization']
  
  // Check if header exists and contains bearer token format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Acceso denegado. Token no suministrado.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'gol_ahora_secreto_seguro_para_firmar_tokens_jwt_2026_xyz')
    
    // Bind verified user details to request object
    req.user = verified
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Acceso denegado. Token inválido o expirado.' })
  }
}
