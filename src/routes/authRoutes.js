import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// REGISTER
router.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        // hash lozinke
        const hashedPassword = bcrypt.hashSync(password, 8);

        // ubaci korisnika u bazu
        const insertUser = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        const result = insertUser.run(username, hashedPassword);

        // kreiraj prvi todo za korisnika
        const defaultTodo = "Welcome to your To-Do list! Add your first todo.";
        const todoStmt = db.prepare('INSERT INTO todos (user_id, task) VALUES (?, ?)');
        todoStmt.run(result.lastInsertRowid, defaultTodo);

        // generiši JWT token
        const token = jwt.sign({ id: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '1h' });

        // vrati token i info o korisniku
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: result.lastInsertRowid, username },
            todo: { task: defaultTodo }
        });

    } catch (error) {
        // ako korisnik već postoji (SQLite constraint) ili neka druga greška
        if (error.code === 'SQLITE_CONSTRAINT') {
            return res.status(409).json({ error: 'Username already exists' });
        }
        console.error(error);
        res.status(503).json({ error: 'User registration failed' });
    }
});

// LOGIN (ostaje nepromenjeno)
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const getUser = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = getUser.get(username);

        if (!user) {
            return res.status(404).json({ error: 'Invalid username or password' });
        }

        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (passwordIsValid) {
            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
            res.json({ message: 'Login successful', token });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }

    } catch (error) {
        console.error(error);
        res.sendStatus(503);
    }
});

// DELETE USER (ostaje nepromenjeno)
router.delete('/delete/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0)
        return res.status(404).json({ error: 'User not found' });

    res.json({ message: `User with id ${id} deleted successfully` });
});

export default router;
