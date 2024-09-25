// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { user } = require('pg/lib/defaults');
const app = express();
const port = 3001;
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres.wewkjwtalqhjugzwrcql:_CPGJypV9RU$Nq-@aws-0-us-west-1.pooler.supabase.com:6543/postgres',
});     

app.use(cors());
app.use(bodyParser.json());

// Initialize game state
let targetNumber = Math.floor(Math.random() * 1000);
let phoneNumbers = ["0000011111"]
let attempts = 0;
app.post('/check-registration',async (req,res)=>{
    const phone = [req.body.phoneNumber]
    const query = 'SELECT COUNT(*) > 0 AS exists FROM users WHERE phone = $1';
    const response = await pool.query(query, phone);
    
    if(response.rows[0].exists){
        // If user exists, fetch their name and best score
        const userQuery = 'SELECT full_name, best_score FROM users WHERE phone = $1';
        const userResponse = await pool.query(userQuery, phone);
    

        if (userResponse.rows.length > 0) {
            const userName = userResponse.rows[0].full_name;
            const bestScore = userResponse.rows[0].best_score;

            res.json({
                isRegistered: true,
                user: userName,
                best_score: bestScore,
                phoneNumber: req.body.phoneNumber
            });
        }
    }
    else{
        res.json({isRegistered: false})
    }
})
app.post('/handle-registration',async (req,res)=>{
    const { best_score, name, phone } = req.body;

// Check if the user with the given phone number exists
const q1 = 'SELECT COUNT(*) > 0 AS exists FROM users WHERE phone = $1';
const r1 = await pool.query(q1, [phone]);

if (!r1.rows[0].exists) {
    // User not registered; proceed to insert
    const query = 'INSERT INTO public.users (best_score, full_name, phone) VALUES ($1, $2, $3)';
    const values = [best_score, name, phone];
    console.log(name)
    try {
        const response = await pool.query(query, values);
        if (response.rowCount > 0) {  // rowCount will be > 0 if the insert was successful
            res.json({ isRegistered: true });
        } else {
            res.json({ isRegistered: false });
        }
    } catch (error) {
        console.error('Error inserting user:', error);
        res.status(500).json({ error: 'Database insert error' });
    }
} else {
    // User is already registered
    res.json({ isRegistered: false });
    }
})
app.post('/update-scores',async (req, res) => {
    const { score, phoneNumber } = req.body;
    const query = 'UPDATE users SET best_score = $1 WHERE phone = $2';
    const values = [score, phoneNumber];
    try {
        const response = await pool.query(query, values);
        res.json({ isUpdated: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update score' });
    }
});
app.post('/handle-leaderboard',async (req, res) => {
    
    const query = 'SELECT full_name, best_score FROM users WHERE best_score > 0 ORDER BY best_score DESC LIMIT 5';  // Add LIMIT 5

    try {
        const response = await pool.query(query);
        res.json({ isUpdated: true, topUsers: response.rows });  // Include the top users in the response
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch top users' });  // Updated error message
    }
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
