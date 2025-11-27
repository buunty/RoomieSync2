const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- ROOMMATES ---
app.get('/api/roommates', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roommates');
    const roommates = rows.map(r => ({
      ...r,
      isVegetarian: Boolean(r.isVegetarian)
    }));
    res.json(roommates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/roommates', async (req, res) => {
  const { id, name, email, role, isVegetarian, avatarUrl, agreedContribution } = req.body;
  try {
    // Upsert (Insert or Update)
    await db.query(
      'INSERT INTO roommates (id, name, email, role, isVegetarian, avatarUrl, agreedContribution) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, email=?, role=?, isVegetarian=?, avatarUrl=?, agreedContribution=?',
      [id, name, email, role, isVegetarian, avatarUrl, agreedContribution, name, email, role, isVegetarian, avatarUrl, agreedContribution]
    );
    res.json({ message: 'Roommate saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXPENSES ---
app.get('/api/expenses', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expenses');
    res.json(rows); 
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  const { id, title, amount, paidBy, category, date, splitAmong } = req.body;
  try {
    await db.query(
      'INSERT INTO expenses (id, title, amount, paidBy, category, date, splitAmong) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, amount, paidBy, category, date, JSON.stringify(splitAmong)]
    );
    res.json({ message: 'Expense added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASKS ---
app.get('/api/tasks', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tasks');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { id, title, assignedTo, dueDate, status, description } = req.body;
  try {
    await db.query(
      'INSERT INTO tasks (id, title, assignedTo, dueDate, status, description) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=?, assignedTo=?, dueDate=?, status=?, description=?',
      [id, title, assignedTo, dueDate, status, description, title, assignedTo, dueDate, status, description]
    );
    res.json({ message: 'Task saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  const { status, lastReminded } = req.body;
  try {
    await db.query('UPDATE tasks SET status = ?, lastReminded = ? WHERE id = ?', [status, lastReminded, req.params.id]);
    res.json({ message: 'Task updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MESSAGES ---
app.get('/api/messages', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM messages ORDER BY timestamp ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  const { id, senderId, content, timestamp, type, relatedTaskId, relatedTaskTitle, relatedTaskStatus } = req.body;
  try {
    await db.query(
      'INSERT INTO messages (id, senderId, content, timestamp, type, relatedTaskId, relatedTaskTitle, relatedTaskStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, senderId, content, timestamp, type, relatedTaskId, relatedTaskTitle, relatedTaskStatus]
    );
    res.json({ message: 'Message sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BUDGETS ---
app.get('/api/budgets', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM budgets');
    const budgetMap = {};
    rows.forEach(row => {
        budgetMap[row.category] = row.amount;
    });
    res.json(budgetMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  const budgets = req.body; // Expecting { "Category": 5000, "Rent": 10000 }
  try {
    await db.query('DELETE FROM budgets'); // Simple Replace All strategy for this app
    const entries = Object.entries(budgets);
    if (entries.length > 0) {
        const values = entries.map(([cat, amt]) => [cat, amt]);
        await db.query('INSERT INTO budgets (category, amount) VALUES ?', [values]);
    }
    res.json({ message: 'Budgets saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BUDGET LABELS ---
app.get('/api/budget_labels', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM budget_labels');
    const labelMap = {};
    rows.forEach(row => {
        labelMap[row.category] = row.label;
    });
    res.json(labelMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budget_labels', async (req, res) => {
  const labels = req.body; 
  try {
    await db.query('DELETE FROM budget_labels'); 
    const entries = Object.entries(labels);
    if (entries.length > 0) {
        const values = entries.map(([cat, lbl]) => [cat, lbl]);
        await db.query('INSERT INTO budget_labels (category, label) VALUES ?', [values]);
    }
    res.json({ message: 'Labels saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});