import type { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';

let db = new sqlite3.Database('./database.sqlite3', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});

db.run(
    'CREATE TABLE IF NOT EXISTS data(id TEXT PRIMARY KEY, digest TEXT, signature TEXT, publicKey TEXT)',
    (err) => {
        if (err) {
            console.log(err);
        }
    }
);

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id, digest, signature, publicKey } = req.body;

    if (req.method === 'POST') {
        try {
            db.run(
                `INSERT INTO data(id, digest, signature, publicKey) VALUES(?, ?, ?, ?)`,
                [id, digest, signature, publicKey],
                function (this: sqlite3.RunResult, err: Error | null) {
                    if (err) {
                        return console.log(err.message);
                    }

                    console.log(
                        `A row has been inserted with rowid ${this.lastID}`
                    );
                }
            );

            res.status(200).json({ message: 'Signature has been stored' });
        } catch (err) {
            res.status(500).json({ message: 'Something went wrong' });
        }
    } else if (req.method === 'GET') {
        const { id } = req.query;

        db.get(
            'SELECT digest, signature, publicKey FROM data WHERE id = ?',
            [id],
            (err, row) => {
                if (err) {
                    res.status(500).json({
                        message: 'An error occurred during the query',
                    });
                    return console.error(err.message);
                }

                if (!row) {
                    res.status(404).json({ message: 'Not found' });
                } else {
                    res.status(200).json(row);
                }
            }
        );
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
