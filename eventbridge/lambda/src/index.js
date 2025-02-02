// Lambda function that pushes a hello world event to AWS EventBridge
exports.handler = async (event) => {
    const AWS = require('aws-sdk');
    const eventBridge = new AWS.EventBridge();

    const params = {
        Entries: [
            {
                Source: 'myapp.hello',
                DetailType: 'HelloWorldEvent',
                Detail: JSON.stringify({ message: 'Hello World' }),
                EventBusName: 'default'
            }
        ]
    };

    try {
        console.log('Attempting to push event to EventBridge...');
        const result = await eventBridge.putEvents(params).promise();
        console.log('Event pushed successfully:', result);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Event pushed successfully',
                data: result
            })
        };
    } catch (error) {
        console.error('Error pushing event:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                message: error.message,
                error: error.name
            })
        };
    }
};