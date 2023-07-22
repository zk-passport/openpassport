import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: `postgresql://postgres:${process.env.PG_PASSWORD}@db.mnztocxnpjbvvzqoopwv.supabase.co:5432/postgres`,
});

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { id, digest, signature, publicKey } = req.body;

    const regex = /modulus: ([\s\S]*?)\npublic exponent:/gm;

    let match = regex.exec(publicKey);
    let modulus;

    if (match) {
        modulus = match[1]; // The first capture group contains the modulus
        modulus = modulus.replace(/\s+/g, ''); // Remove whitespace from the modulus string
    }

    if (req.method === 'POST') {
        try {
            const client = await pool.connect();
            await client.query(
                `INSERT INTO data(id, digest, signature, publicKey) VALUES($1, $2, $3, $4)`,
                [id, digest, signature, modulus]
            );

            res.status(200).json({ message: 'Data has been stored' });
            client.release();
        } catch (err) {
            res.status(500).json({ message: 'Something went wrong' });
            console.log(err);
        }
    } else if (req.method === 'GET') {
        const { id } = req.query;
        try {
            const client = await pool.connect();
            const { rows } = await client.query(
                'SELECT digest, signature, publicKey FROM data WHERE id = $1',
                [id]
            );

            if (rows.length > 0) {
                res.status(200).json(rows[0]);
            } else {
                res.status(404).json({ message: 'Not found' });
            }
            client.release();
        } catch (err) {
            res.status(500).json({
                message: 'An error occurred during the query',
            });
            console.log(err);
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}
