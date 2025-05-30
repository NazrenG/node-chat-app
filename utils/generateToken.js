import jwt from 'jsonwebtoken';



export const generateToken = (user,res) => {
    const id = user._id;
    const accessToken = jwt.sign({ id: id, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: id, email: user.email }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    res.cookie('accessToken', accessToken, {
        maxAge: 15 * 60 * 1000, // 15 minutes
        httpOnly: true,
        secure: false, // Set to true in production (HTTPS)
        sameSite: 'strict',
    });
    res.cookie('refreshToken', refreshToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        secure: false, // Set to true in production (HTTPS)
        sameSite: 'strict',
    });

    return { accessToken, refreshToken };
}