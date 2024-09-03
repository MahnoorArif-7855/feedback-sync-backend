
# Feedback Sync Backend

This repository houses the core application of the FeedbackSync system. It is responsible for integrating various feedback sources, processing data, and providing a GraphQL API for client applications (like the Slack client) to interact with the processed data.

## Tech Stack

- **TypeScript**: Ensures type safety and modern JavaScript features.
- **Express.js**: The primary web framework used to build the API.
- **express-graphql**: Middleware to integrate GraphQL with Express.js.
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB, used to manage and interact with the database.
- **LangChain**: A toolkit that facilitates language model integration, useful for any LLM-related features.
- **Weaviate**: Vector store for semantic search and other AI-related data storage.
- **Luxon**: Date-time library for managing and manipulating dates.

## Deployment

The app is designed to be deployed on **Heroku**. Upon deployment, Heroku will automatically execute `yarn build` to compile TypeScript to CommonJS using `tsc`. The app starts by running the compiled `dist/app.js` main file with `yarn start`.

**Note:** Future plans include using `pm2` for better process management and stability.

## Getting Started

### Environment Variables

1. Copy `.env.sample` and rename it to `.env`.
2. Populate the environment variables with values provided by another developer.

### Running the App Locally

Ensure you are using Node.js version 16 and Yarn version 3.

1. **Install dependencies**:  
   ```bash
   yarn
   ```

2. **Start the app in development mode**:  
   ```bash
   yarn dev
   ```
   This runs the app using `ts-node-dev`, which automatically watches for file changes, recompiles TypeScript, and restarts the server.

   The server will be accessible at [http://localhost:4000](http://localhost:4000).

### Reset Admin User Cache

The admin user state is cached in memory for performance optimization. You can reset this cache by making a GET request to the following endpoint:

```
GET http://localhost:4000/usersList?clearAdminCache=true
```

## Code Overview

### GraphQL Integration

GraphQL is a query language for APIs and a runtime for executing those queries. It allows clients to request exactly the data they need, and nothing more, which can lead to more efficient data retrieval and reduced payload sizes compared to traditional REST APIs.

#### Setup and Configuration

In the FeedbackSync backend, GraphQL is integrated using the `express-graphql` middleware, which connects the Express.js server with a GraphQL schema.

```typescript
import { graphqlHTTP } from 'express-graphql';
import schema from './Schemas/index';

app.use(
  '/graphql',
  graphqlHTTP((req: any) => ({
    schema: schema,
    context: req.context,
    graphiql: true, // Enable GraphiQL interface for testing
  }))
);
```

- **Schema**: The schema defines the structure of the API. It includes types, queries, mutations, and resolvers. The schema is typically defined using GraphQL Schema Definition Language (SDL) or programmatically using libraries like `graphql-tools`.
  
  - **Types**: Represent the shape of the data (e.g., `User`, `Feedback`, `Organization`).
  - **Queries**: Define the read operations that clients can perform (e.g., fetching user details, retrieving feedback).
  - **Mutations**: Define write operations (e.g., creating new feedback, updating user information).
  - **Resolvers**: Functions that resolve the data for each field in the schema, often by interacting with the database via Mongoose or other services.

- **Context**: The `context` parameter in `graphqlHTTP` is used to pass information, like authentication details or database connections, to the resolvers. This allows resolvers to have access to the necessary data and tools to perform their tasks.

- **GraphiQL**: The `graphiql: true` option enables GraphiQL, an in-browser IDE that allows developers to explore the GraphQL API, write queries, and see real-time results. This is especially useful during development and debugging.

#### Example Schema and Resolvers

Here’s a simplified example of how the schema and resolvers might be structured:

**Schema Definition (`Schemas/index.ts`):**

```typescript
import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLID } from 'graphql';
import { User } from '../database';
import UserType from './TypesDefs/UserType';

const Query = new GraphQLObjectType({
  name: 'Query',
  fields: {
    getAllUsers: {
      type: new GraphQLList(UserType),
      args: { uid: { type: GraphQLString } },
      resolve(parent, args, context) {
        if (!context.user) {
          throw new Error('Unauthorized');
        }
        return User.find({ userId: args.uid });
      },
    },
  },
});

const Mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    findUserInfo: {
      type: new GraphQLList(UserType),
      args: {
        uid: { type: GraphQLString },
      },
      resolve(parent, args, context) {
        return User.aggregate([
          {
            $lookup: {
              from: 'organizations',
              localField: 'organizationId',
              foreignField: '_id',
              as: 'organizationDetails',
            },
          },
          {
            $match: {
              // Replace 'SPECIFIC_USER_ID' with the _id of the user you want to filter for
              userId: args.uid,
            },
          },
        ]).exec();
      },
    },
  },
});

export default new GraphQLSchema({ query: RootQuery, mutation: Mutation });

```

#### Benefits of Using GraphQL in FeedbackSync

- **Efficient Data Retrieval**: Clients can specify exactly which fields they need, reducing the amount of data transferred over the network. This is particularly useful in applications with complex data models, like FeedbackSync, where entities like `User`, `Feedback`, and `Organization` might have many fields.

- **Single Endpoint**: Unlike REST, where you might have multiple endpoints for different resources, GraphQL uses a single `/graphql` endpoint for all operations. This simplifies the API structure and reduces the need for versioning.

- **Strongly Typed Schema**: The schema acts as a contract between the frontend and backend, ensuring that the API is self-documenting and that clients know exactly what data they can request and how it will be structured.

- **Real-time Capabilities**: Although not implemented in the basic setup, GraphQL supports subscriptions, allowing for real-time updates. This could be a future enhancement for FeedbackSync to provide real-time feedback notifications.

- **Ease of Expansion**: Adding new types, queries, or mutations to the API is straightforward, making the system easily extensible as new features are developed.

#### GraphQL Playground

For development purposes, the app includes GraphQL Playground, an interactive, in-browser GraphQL IDE available at the `/playground` route. Developers can use it to:

- Write and test queries/mutations.
- Explore the API schema.
- See real-time results from the backend.

### Future Enhancements

- **Subscriptions**: Implementing GraphQL subscriptions would allow FeedbackSync to push updates to clients in real-time, such as when new feedback is received or processed.
- **Federation**: If FeedbackSync were to scale and require multiple GraphQL servers, implementing GraphQL Federation could allow for a distributed GraphQL architecture.

---

This expanded section provides a more thorough explanation of how GraphQL is integrated into the FeedbackSync backend, its benefits, and potential future enhancements.
### MongoDB Connection

MongoDB is connected using Mongoose, an ODM library that helps manage MongoDB connections and schema definitions.

```typescript
import { connectToDB, watchChangeStreams } from './database';

(async () => {
  try {
    await connectToDB();
    await watchChangeStreams(); // Initialize listener outside IIFE
  } catch (error) {
    console.error('Unable to start App', error);
    process.exit(1);
  }
})();
```
### 1. **Importing Dependencies**
```typescript
import mongoose from 'mongoose';
import config from '../config';
```
- **`mongoose`**: This is the ODM (Object Data Modeling) library used to interact with MongoDB in a structured way.
- **`config`**: The configuration file likely contains environment-specific settings, such as the database URI (`DB_URI`).

### 2. **Exporting Models**
```typescript
export { default as Feedback } from './models/feedback.model';
export { default as User } from './models/user.model';
export { default as Organization } from './models/organization.model';
export { default as Billing } from './models/billing.model';
export { default as Admin } from './models/admin.modal';
export { default as FeedbackTemp } from './models/feedbackTemp.modal';
export { default as Search } from './models/search.modal';
export { default as FeedbackTags } from './models/tags.modal';
export { default as AnalysisOutputs } from './models/analysisOutput.modal';
export { default as ZendeskTicketComments } from './models/zendeskTicketComments.modal';
export { default as Blogs } from './models/blog.modal';
export { default as IntercomWebhook } from './models/intercomWebhook.model';
export { default as UnKnownApps } from './models/unKnownApps.model';
```
- Each model is exported so it can be used throughout the application. These models define the schema and structure of the documents stored in the MongoDB collections. For example, `Feedback` represents feedback data, `User` represents user data, and so on.

### 3. **Database Connection URI**
```typescript
const uri = config.DB_URI;
```
- **`uri`**: The connection string used to connect to the MongoDB database. It’s typically stored in an environment variable for security reasons and retrieved from the `config` object.

### 4. **Connection State Management**
```typescript
let isConnected: boolean;
let db: typeof mongoose;
```
- **`isConnected`**: This boolean variable tracks whether the application is already connected to the database to avoid redundant connection attempts.
- **`db`**: This holds the instance of the connected database.

### 5. **Connecting to the Database**
```typescript
export const connectToDB = async () => {
  if (isConnected) return db;

  try {
    db = await mongoose.connect(uri ?? '');
    isConnected = !!db.connections[0].readyState;
    console.log('Connected to Mongo');
    return db;
  } catch (err) {
    if (err instanceof Error) throw new Error(err.message);
    throw new Error('Error connecting to Mongo');
  }
};
```
- **`connectToDB`**: This is an asynchronous function that establishes a connection to the MongoDB database.
  - **Check Connection**: If the application is already connected (`isConnected` is `true`), the function returns the existing database instance (`db`).
  - **Try Block**: 
    - **`mongoose.connect(uri ?? '')`**: Attempts to connect to the database using the URI. The `?? ''` ensures that even if the URI is `null` or `undefined`, it falls back to an empty string, though ideally, the URI should be defined.
    - **`isConnected`**: The `readyState` property of the connection is checked to confirm the connection is successful (`1` indicates connected).
    - **Logging**: Logs a message to indicate a successful connection.
    - **Return**: The connected database instance (`db`) is returned.
  - **Catch Block**: Handles any errors that occur during the connection attempt. If the error is an instance of the `Error` class, its message is thrown; otherwise, a generic error message is thrown.

### Usage in the Application:
- The `connectToDB` function is typically called once during the application startup to establish a connection to the database.
- The exported models are used throughout the application to perform CRUD (Create, Read, Update, Delete) operations on the MongoDB collections.

This setup ensures that the application connects to MongoDB efficiently and handles any potential connection errors gracefully.

### Cron Jobs

Cron jobs are scheduled tasks that run at specific times. In this app, `node-cron` is used to schedule a job that triggers at 9 AM every Friday (in production) or 11 AM every Friday (in development). This task could be anything from data synchronization to sending out reports.

```typescript
import cron from 'node-cron';
import { cronJobApi } from './utils/cronJob';

const cronTime = isDev ? '0 11 * * 5' : '0 9 * * 5';

cron.schedule(
  cronTime,
  () => {
    cronJobApi();
  },
  {
    timezone: 'America/Los_Angeles',
  }
);
```

### Cron Job Function

The `cronJobApi` function is designed to run as a scheduled task (or "cron job") in the FeedbackSync system. This function performs periodic checks and automated actions for organizations that have opted in to receive weekly updates via Slack channels. Here’s an overview of what the function does:

#### Key Features:

1. **Execution Log:**
   - The function logs the start and end times of the cron job execution, along with the details of each organization's processing.

2. **Fetching Relevant Organizations:**
   - The function queries the `Organization` database to retrieve a list of organizations that have an `automatic_update_channel_Id` field. This field indicates that the organization has configured a Slack channel for receiving automatic updates.

3. **Weekly Analysis Request:**
   - For each organization, the function sends an HTTP POST request to an external API (specified by the `FEEDBACK_GPT_WEAVIATE_API` environment variable) to generate an overall weekly analysis of customer feedback.
   - The request includes the organization ID, analysis type, time frame (last 7 days), and specifies whether to cache the data.

4. **Handling API Response:**
   - **Analysis Available:**
     - If the API returns analyzed data, the function processes the data to extract key insights. It constructs a message summarizing the feedback and posts it to the organization's specified Slack channel using the Slack Web API.
     - The function limits the number of items shown in the message to avoid overwhelming the recipient and includes links for further exploration.
   - **Insufficient Feedback:**
     - If the API returns little or no feedback data, a different message is sent to inform the organization that there wasn't enough feedback to generate an analysis. The message encourages the organization to set up more integrations to ensure a steady flow of feedback.

5. **Error Handling:**
   - The function includes comprehensive error handling to manage potential issues, such as API failures or issues with posting to Slack.
   - Errors are logged, and appropriate fallback messages are sent when necessary.

6. **Delays Between Requests:**
   - The function introduces a delay (`setTimeout`) between processing different organizations to manage API rate limits and avoid overwhelming the system.

7. **Detailed Logging:**
   - Throughout the process, the function logs key actions and responses. These logs provide visibility into the cron job’s execution, making it easier to troubleshoot any issues.

#### Benefits:

- **Automation:** This function automates the process of generating and delivering weekly feedback analysis, saving time and ensuring consistency.
- **Personalization:** The function tailors messages to each organization based on their specific data, making the updates more relevant and actionable.
- **Resilience:** By handling errors gracefully and logging extensively, the function ensures that issues can be identified and resolved quickly without disrupting service.

This cron job is an integral part of the FeedbackSync system, providing organizations with regular insights into their customer feedback, thereby supporting informed decision-making.

### Routes and Middlewares

The app consists of multiple routes that handle various functionalities, such as:

- **Integrations**: Handle data ingestion from various sources like Slack, Intercom, Zendesk, etc.
- **User Management**: Includes user authentication, caching, and role management.
- **Billing**: Handles payment processing and billing portals using Stripe.
- **Search and Embeddings**: Routes for AI-based searches, leveraging Weaviate for vector storage.
- **Slack Interactions**: Manages Slack notifications, channel integrations, and message sending.

Middlewares like `authMiddleware` ensure secure access to the routes, and `adminMiddleware` restricts access to admin-specific routes.

### Authentication Middleware

The authentication middleware is a crucial component of the Node.js/Express.js application that handles various webhook and authorization scenarios. It ensures that only authorized requests are processed, protecting the application's resources from unauthorized access. Below is an overview of the middleware's functionality and how it handles different authorization scenarios.

#### Key Features:
1. **Discourse Webhook Authentication:**
   - The middleware checks for the presence of the `x-discourse-event-signature` header.
   - It extracts the organization ID from the request URL and fetches the corresponding organization data from the database.
   - Using the organization's `discourseSecretKey`, the middleware generates an HMAC (Hash-based Message Authentication Code) to verify the request's integrity.
   - If the generated HMAC matches the signature in the request header, the request is authorized; otherwise, a `403 Forbidden` response is returned.

2. **Zendesk Webhook Authentication:**
   - The middleware checks for the `zendesk-webhook-secret-key` header.
   - It validates the webhook's secret key against the one stored in the organization's data.
   - If the keys match, the request is authorized; otherwise, a `403 Forbidden` response is returned.

3. **Intercom Webhook Authentication:**
   - The middleware checks for the `intercom-webhook-subscription-id` header.
   - It extracts the app ID from the subscription ID and verifies it against the organization's `intercomAppId`.
   - If the app ID matches, the request is authorized; otherwise, a `403 Forbidden` response is returned.

4. **Stripe Webhook Authentication:**
   - The middleware passes through the request if the `stripe-signature` header is present, relying on further verification downstream.

5. **Firebase ID Token Verification:**
   - The middleware checks for a Firebase ID token in the `Authorization` header or the `__session` cookie.
   - If a valid token is found, it verifies the token using Firebase Admin SDK and attaches the decoded user information to the request object.
   - If the token is missing or invalid, the middleware responds with a `403 Unauthorized` status.

6. **Public Authorization:**
   - If the request is authorized with a `public` token, it is allowed to proceed without further checks.


### Error Handling

An error-handling middleware catches any errors that occur during the request-response cycle and returns a standardized JSON error response.

```typescript
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err.message, err.stack);
  res.status(statusCode).json({ message: err.message });

  return;
};

app.use(errorHandler);
```
### Integrations and Webhook Controllers Overview

The `webhook.controller.ts` file in your project acts as a centralized controller for handling various webhooks from different platforms. Each platform has its own dedicated controller, which is responsible for processing and managing the incoming webhook data. Below is an overview of each integration and how the code is structured:

#### 1. **Stripe Webhook Controller (`stripe.controller.ts`)**
   - **Purpose:** Handles incoming webhook events from Stripe, typically related to payment processing, subscriptions, and other financial transactions.
   - **Functionality:** This controller would typically validate the incoming webhook signature, process the event data, and update your system accordingly, such as managing customer subscriptions, processing payments, or handling disputes.

#### 2. **Zendesk Webhook Controller (`zendesk.controller.ts`)**
   - **Purpose:** Manages incoming webhooks from Zendesk, usually related to support tickets, customer interactions, or updates in the support system.
   - **Functionality:** This controller processes the incoming Zendesk events, such as new ticket creation, ticket status updates, or customer feedback, and syncs this data with your system.

#### 3. **Discourse Webhook Controller (`discourse.controller.ts`)**
   - **Purpose:** Handles webhooks from Discourse, a popular community discussion platform.
   - **Functionality:** This controller processes events from Discourse such as new posts, replies, or user updates, and ensures that this information is appropriately handled within your application.

#### 4. **Intercom Webhook Controller (`intercom.controller.ts`)**
   - **Purpose:** Manages incoming webhook events from Intercom, which is often used for customer messaging, engagement, and support.
   - **Functionality:** This controller processes events like new conversations, message updates, or user actions, ensuring that your system stays in sync with customer interactions managed through Intercom.

### Centralized Export
In the `index.ts` file within the `webhook.controller` directory, all the individual webhook controllers are imported and then exported as a single object. This makes it easier to manage and access each webhook controller from other parts of the application.

### How It All Fits Together
- **Integration Controllers:** These controllers (`g2.controller.ts`, `zendesk.controller.ts`) are responsible for managing specific integrations, such as G2 Crowd and Zendesk.
- **Webhook Controllers:** These controllers (`discourse.controller.ts`, `intercom.controller.ts`, `stripe.controller.ts`, `zendesk.controller.ts`) handle the incoming webhook data, ensuring that events from external services are properly processed and integrated into your system.

This structure helps maintain a clean and modular architecture, allowing for easy management and extension of your system’s webhook and integration functionalities. Each platform's specific logic is encapsulated within its controller, making the codebase more organized and easier to maintain.



## Additional Features

- **GraphQL Playground**: Accessible at `/playground`, providing an interactive UI for testing GraphQL queries.
- **Firebase Admin SDK**: Integrated for managing Firebase services, with separate credentials for development and production environments.