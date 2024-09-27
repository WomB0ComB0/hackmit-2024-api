import { httpRouter } from 'convex/server';
import { api } from './_generated/api';
import { httpAction } from './_generated/server';

const http = httpRouter();

http.route({
  path: '/api/users',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const { name, email } = await request.json();
    const userId = await ctx.runMutation(api.users.createUser, { name, email });
    return new Response(JSON.stringify({ userId }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }),
});

http.route({
  path: '/api/transactions',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const transactionData = await request.json();

    const fastApiResponse = await fetch(
      'https://hackmit-2024-api-703466588724.us-central1.run.app/api/v1/predict_fraud',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        body: JSON.stringify(transactionData),
      },
    );

    const fraudPrediction = await fastApiResponse.json();

    const transactionId = await ctx.runMutation(api.transactions.createTransaction, {
      ...transactionData,
      isFraudulent: fraudPrediction.is_fraudulent,
      fraudExplanation: fraudPrediction.fraud_explanation,
    });

    return new Response(JSON.stringify({ transactionId, ...fraudPrediction }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }),
});

export default http;
