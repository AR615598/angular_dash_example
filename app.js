const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'rfid'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
  

    // Routes

    // Get all users
app.get('/RSSI_over_time', (req, res) => {
    const query = `
        SELECT
            STR_TO_DATE(CONCAT(date, ' ', hour, ':00:00'), '%Y-%m-%d %H:%i:%s') AS datetime,
            assigned_to,
            tag_id,
            avg_rssi
        FROM (
            SELECT
                DATE(start_time) AS date,
                HOUR(start_time) AS hour,
                assigned_to,
                tag_id,
                AVG(rssi) AS avg_rssi
            FROM rtls_rfid_joined
            GROUP BY date, hour, tag_id, assigned_to
        ) AS sub
        ORDER BY tag_id, datetime;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});
app.get('/average_RSSI', (req, res) => {
    const query = `
        SELECT 
            AVG(rssi) as avg_rssi,
            tag_id,
            active,
            tag_type
        FROM rtls_rfid_joined
        GROUP BY tag_id, tag_type, active;
    `;

    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

    // Start server
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});