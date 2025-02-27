Leaderboard System

This project is a high-performance leaderboard system built with Node.js and TypeScript using a microservices architecture. The system is designed to handle millions of active users by leveraging several key components:

    Node App (API): Handles incoming REST API requests.
    Worker: Processes high-load operations asynchronously via a message queue.
    RabbitMQ (Message Queue): Buffers high-volume operations (e.g., score updates).
    Redis Cluster: Stores the real-time leaderboard data using a Sorted Set.
    Socket.io: Provides real-time updates to the frontend.
    Cron Jobs: Schedule weekly prize distributions and leaderboard resets.
    Kubernetes (K8s): Deploys and scales the system components using Deployments, StatefulSets, and Services with a Load Balancer.
    Horizontal Pod Autoscaler (HPA): Automatically scales worker pods based on CPU usage.

Table of Contents

    Architecture Overview
    Endpoints
    System Workflow
    Deployment Instructions
        Local Setup
        Docker Build & Push
        Kubernetes Deployment
    Testing
        Worker Service Tests
        Stress Test
    Environment Variables
    Future Enhancements

Architecture Overview

The system is designed to scale horizontally and handle extreme traffic. Here’s a brief overview of each component:

    Node App (API):
        Exposes REST endpoints to receive user requests.
        Receives “earn” requests from users and publishes them to RabbitMQ.
        Serves leaderboard queries via GET requests.
        Runs behind a Kubernetes Load Balancer for high availability.

    Worker:
        Runs as a separate service (Deployment) in Kubernetes.
        Listens to RabbitMQ queues for asynchronous processing.
        Processes “create player” and “earn” messages.
        Updates the Redis leaderboard (using zIncrBy or similar methods) and, if applicable, emits real-time updates via Socket.io.
        Is horizontally scaled (recommended starting with 100–200 replicas for high load scenarios).

    RabbitMQ:
        Acts as a buffer for high-volume "earn" and "create player" operations.
        Distributes messages among worker pods automatically using a round-robin mechanism.
        For high traffic, consider using a RabbitMQ cluster.

    Redis Cluster:
        Stores leaderboard data using a Sorted Set (leaderboard:currentWeek).
        Supports high write and read throughput.
        Deployed as a cluster (e.g., 6 nodes) for performance and resilience.

    Socket.io:
        Provides real-time updates to the frontend when significant changes occur (e.g., a player enters the Top 100).

    Cron Jobs:
        Schedule weekly prize distributions and reset the leaderboard.
        Example: Every Sunday at 23:59, the system calculates prize pools, updates player balances in the database, and resets the Redis leaderboard.

    Kubernetes & Load Balancing:
        The system is containerized and deployed on Kubernetes.
        Node App and Worker deployments are managed separately with proper scaling.
        A Load Balancer (Service type: LoadBalancer) distributes incoming traffic to Node App pods.
        Horizontal Pod Autoscaler (HPA) can automatically scale pods based on metrics like CPU usage.

Endpoints
Leaderboard Endpoints

    GET /api/v1/leaderboard
        Returns the Top 100 players from the leaderboard.
        Optional Query Parameter: searchPlayerId — if provided, the API also returns the player’s ranking along with the 3 players above and 2 below that player.
        Example:

GET http://localhost:3000/api/v1/leaderboard?searchPlayerId=119

Response:

    {
      "top100": [
        { "playerId": 1, "score": 9999, "player": { "name": "Alice", "country": "US", "money": 5000 } },
        ...
      ],
      "searchedPlayerRange": [
        { "playerId": 117, "score": 8500, "player": { "name": "Bob", "country": "UK", "money": 4500 } },
        { "playerId": 119, "score": 8400, "player": { "name": "Charlie", "country": "DE", "money": 4200 } },
        { "playerId": 120, "score": 8300, "player": { "name": "Diana", "country": "FR", "money": 4100 } }
      ]
    }

POST /api/v1/leaderboard/earn

    Publishes an "earn" message to RabbitMQ.
    Request Body Example:

    {
      "playerId": 123,
      "newScore": 5000
    }

    The Worker processes the message, updates the Redis leaderboard, and updates the weekly earnings.

POST /api/v1/players (if implemented)

    Creates a new player in the database.
    Request Body Example:

        {
          "name": "DoeJohn",
          "country": "US"
        }

    POST /api/v1/distribution/weekly
        Triggers the weekly prize distribution manually (also scheduled via cron).
        Distributes prize pool percentages to Top 100 players and resets the leaderboard and weekly earnings.

System Workflow

    Player Creation:
        A new player is created in the database using the /api/v1/players endpoint or through a worker message.
        Optionally, a player can be initialized in the Redis leaderboard with a score of 0.

    Earning (Score Update):
        When a player earns points, a request is sent to /api/v1/leaderboard/earn.
        Instead of immediately updating Redis, the API publishes a message to RabbitMQ.
        Worker pods consume these messages, calculate the difference between the new score and the old score, update the Redis leaderboard using zIncrBy, and update the weekly earnings counter.

    Leaderboard Query:
        A GET request to /api/v1/leaderboard retrieves the Top 100 players.
        If a searchPlayerId query parameter is provided, the backend also retrieves the ranking range around that player.

    Weekly Distribution:
        Every Sunday at 23:59 (configured via a cron job), the system calculates the prize pool (2% of total weekly earnings) and distributes it among the Top 100 players.
        After distribution, the Redis leaderboard and weekly earnings counter are reset.

    Real-Time Updates:
        When a significant change occurs (e.g., a player enters the Top 100), the backend emits a Socket.io event (leaderboard-update) to connected clients, prompting the frontend to refresh the leaderboard.

Deployment Instructions
Local Setup

    Clone the Repository:

git clone <repository-url>
cd leaderboard-backend

Install Dependencies:

npm install

Set Up Environment Variables:

    Create a .env file in the project root.
    Include variables such as:

    NODE_ENV=development
    PORT=3000
    SOCKET_SERVER_URL=http://localhost:3000
    RABBITMQ_URL=amqp://localhost:5672
    REDIS_URL=redis://localhost:6379

Start the Application:

    To run the API:

npm run dev

To run the Worker in a separate terminal:

        npm run worker

Docker Build & Push

    Build the Docker Image:

docker build -t your-registry/my-backend:latest .

Push the Image to Your Registry:

    docker push your-registry/my-backend:latest

Kubernetes Deployment

    Create Kubernetes Manifest Files:
        Place your YAML files in a folder called k8s-manifests/:
            rabbitmq-deployment.yaml
            redis-cluster-statefulset.yaml
            node-app-deployment.yaml
            node-app-service.yaml
            node-worker-deployment.yaml
            (Optionally, worker-hpa.yaml for autoscaling)

    Apply Manifests:

kubectl apply -f k8s-manifests/

Verify Deployments and Services:

    kubectl get pods
    kubectl get svc

    Access the API:
        Use the external IP from node-app-service to test endpoints (e.g., http://<EXTERNAL-IP>/api/v1/leaderboard).

Testing
Worker Service Tests

    File: src/testWorkerService.ts
    Purpose: Create a single player (e.g., "DoeJohn") and perform an earn operation.
    Run:

ts-node src/testWorkerService.ts

or after building:

    npm run build
    node dist/testWorkerService.js

Stress Test

    File: src/stressTestFull.ts
    Purpose: Simulate high traffic by creating 1,000,000 players in chunks and sending earn messages for each.
    Run:

ts-node src/stressTestFull.ts

or after building:

    node dist/stressTestFull.js

    Note: Adjust chunk sizes and wait times according to your environment’s capacity.

Environment Variables

The system relies on several environment variables. Below is an example of what your .env file might include:

NODE_ENV=development
PORT=3000
SOCKET_SERVER_URL=http://localhost:3000
RABBITMQ_URL=amqp://rabbitmq-service:5672
REDIS_URL=redis://localhost:6379

When deploying to Kubernetes, you may use ConfigMaps and Secrets to manage these variables.
Future Enhancements

    Horizontal Pod Autoscaler (HPA):
    Configure HPA for both Node App and Worker deployments to automatically scale based on CPU/memory usage.

    Advanced Metrics:
    Implement custom metrics (e.g., RabbitMQ queue length) for more dynamic scaling.

    Security:
    Add authentication (JWT) for API endpoints and secure communication between components (TLS, network policies).

    Persistent Storage:
    For Redis and RabbitMQ, configure persistent volumes to maintain data across pod restarts.

    Monitoring & Logging:
    Integrate monitoring (Prometheus, Grafana) and logging (ELK stack) for better observability of the system.

Conclusion

This project demonstrates a scalable leaderboard system using:

    A Node.js API for handling requests,
    A worker system processing high loads via RabbitMQ,
    A Redis cluster for real-time scoreboard data,
    Socket.io for real-time frontend updates,
    And Kubernetes for orchestrating and scaling all components.

Follow the deployment instructions to set up your environment, run tests, and observe the system behavior under load. With proper scaling (both manual and via HPA), the system is designed to handle millions of active users.
