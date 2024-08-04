import { init } from "@sentry/node";
import { nodeProfilingIntegration } from '@sentry/profiling-node';

init({
  dsn: "https://b9aacde06ec3352f373c1a7a2ce32fd3@o4506762839916544.ingest.us.sentry.io/4507716661018624",
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
