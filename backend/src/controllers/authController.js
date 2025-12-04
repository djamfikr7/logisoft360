const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Generate username from email
        const username = email.split('@')[0];

        const userExists = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                fullName: name,
                role: role || 'viewer' // Valid roles: admin, manager, cashier, viewer
            }
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user.id)
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate a user
// @route   POST /api/v1/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                token: generateToken(user.id)
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get user data
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        res.json({
            _id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role
        });
    } catch (error) {
        next(error);
    }
};

// Generate reset token (simple implementation without email)
const generateResetToken = () => {
    return require('crypto').randomBytes(32).toString('hex');
};

// Store for reset tokens (in production, use Redis or database)
const resetTokens = new Map();

// @desc    Request password reset
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if email exists for security
            return res.json({
                message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
                // For demo purposes, we return the token directly
                // In production, this would be sent via email
            });
        }

        // Generate reset token
        const resetToken = generateResetToken();
        const expiresAt = Date.now() + 3600000; // 1 hour

        // Store token (in production, store hashed token in database)
        resetTokens.set(resetToken, {
            userId: user.id,
            expiresAt
        });

        // In production, send email with reset link
        // For demo, we return the token directly
        res.json({
            message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
            // Demo only - remove in production
            resetToken,
            resetUrl: `http://localhost:3000/reset-password?token=${resetToken}`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        // Validate token
        const tokenData = resetTokens.get(token);

        if (!tokenData) {
            res.status(400);
            throw new Error('Token invalide ou expiré');
        }

        if (Date.now() > tokenData.expiresAt) {
            resetTokens.delete(token);
            res.status(400);
            throw new Error('Token expiré');
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update user password
        await prisma.user.update({
            where: { id: tokenData.userId },
            data: { passwordHash }
        });

        // Remove used token
        resetTokens.delete(token);

        res.json({ message: 'Mot de passe réinitialisé avec succès' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword
};
