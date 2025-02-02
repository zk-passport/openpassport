const express = require('express');
const AWS = require('aws-sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure AWS
AWS.config.update({
    region: process.env.AWS_REGION,
    credentials: new AWS.SharedIniFileCredentials({ profile: process.env.AWS_PROFILE })
});

const eventbridge = new AWS.EventBridge();

// Create a rule to forward events to this server
async function createEventRule() {
    try {
        // Create the rule
        const ruleName = 'MyAppHelloWorldRule';
        await eventbridge.putRule({
            Name: ruleName,
            EventPattern: JSON.stringify({
                source: ['myapp.hello'],
                'detail-type': ['HelloWorldEvent']
            }),
            State: 'ENABLED'
        }).promise();

        console.log('EventBridge rule created successfully');
    } catch (error) {
        console.error('Error creating EventBridge rule:', error);
    }
}

// Start the server and create the rule
app.listen(port, async () => {
    console.log(`Server listening at http://localhost:${port}`);
    await createEventRule();
});

// Endpoint to receive events
app.post('/events', express.json(), (req, res) => {
    const event = req.body;
    console.log('Received event:', JSON.stringify(event, null, 2));
    res.status(200).send('Event received');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('Server is running');
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
});