# InterviewPrep

This project grew out of wanting to prepare for an interview for a job that would have focused on Angular. As I had been using React exclusively for several months, I needed to refresh my Angular skills. Then I began to add more things to make up for my focus on AWS Amplify. The result is in some ways the opposite of what I have in my previous videos:

* Angular instead of React/NextJS
* Angular Material instead of AWS Amplify's UI library. (I do, however, use Tailwind CSS in both.)
* Postgres instead of DynamoDB (SQL vs NoSQL)
* REST (using a NodeJS/Express backend) vs GraphQL (using Amplify and AppSync)
* This project has nothing in regard to authentication (yet), while the Amplify project implemented authentication right at the beginning.
* AWS infrastructure is set up and maintained using Terraform. That is obviously different from the approach AWS Amplify takes.
* CI/CD (continuous integration/continuous deployment) workflow.

Also, in the Amplify project I haven't yet implemented any automated testing but in this project I have unit and integration tests. I set up a GitHub Workflow with GitHub Actions to run the tests when there is a push to or a pull request on specified branches.

This project is Dockerized, and I developed it in a devcontainer. 

## Devcontainer

I'm using the [Node.js & TypeScript (typescript-node)](https://github.com/devcontainers/templates/tree/main/src/typescript-node) devcontainer. The features I added are

* [sshpass](https://github.com/hspaans/devcontainer-features/tree/master/src/sshpass): installs the GitHub CLI
* [Angular CLI](https://github.com/devcontainers-extra/features/tree/main/src/angular-cli)
* [docker-outside-of-docker](https://github.com/devcontainers/features/tree/main/src/docker-outside-of-docker): "Re-use the host docker socket, adding the Docker CLI to a container. Feature invokes a script to enable using a forwarded Docker socket within a container to run Docker commands."
* [Prettier](https://github.com/devcontainers-community/npm-features/tree/main/src/prettier)
* [AWS CLI](https://github.com/devcontainers/features/tree/main/src/aws-cli)
* [Terraform](https://github.com/devcontainers/features/tree/main/src/terraform)
* [PostgreSQL Client](https://github.com/robbert229/devcontainer-features/blob/main/src/postgresql-client/README.md)

In `devcontainer.json` you'll see that I'm specifying a network. That's so the devcontainer and the Docker services can communicate with one another. For instance, from a shell within the devcontainer I can connect to the service running the Postgres test database.

I also have some mounts so that

* git can authenticate with GitHub using the SSH agent on my laptop (the host machine)
* devcontainer can communicate with the host's Docker daemon
* the AWS credentials and configuration are available within the devcontainer.

### NOTE

I'm having a peculiar issue with bind mounts in `docker-compose.yml` when I try to use a relative reference. For example, the following *should* (I believe) bind the `backend` directory within root directory of my app (`interview-prep`) in the devcontainer to the `/app/backend` directory within the backend service:
```yaml
services:
  backend:
    volumes:
      - ./backend:/app/backend
```
Unfortunately, I get an error saying...
```
Attaching to frontend-1
Error response from daemon: Mounts denied: 
The path /workspaces/interview-prep/backend is not shared from the host and is not known to Docker.
You can configure shared paths from Docker -> Preferences... -> Resources -> File Sharing.
See https://docs.docker.com/desktop/mac for more info.
```
That error isn't helpful, as `workspaces` isn't even a "real" directory and can't be added to shared paths. In any event, I wouldn't want every user of a project to have to specify a directory on his or her host machine; a devcontainer shouldn't require that. I can get around the error by supplying a full, absolute path, e.g., `/Users/davidsilva/Dev/interview-prep/backend:/app/backend`, or by doing what I'm doing until I can figure out the relative directory thing -- namely, setting an environment variable in `devcontainer.json`,
```json
  "remoteEnv": {
    "HOST_PROJECT_PATH": "${localWorkspaceFolder}"
  },
```
and using `HOST_PROJECT_PATH` in `docker-compose.yml`:
```yaml
services:
  backend:
    volumes:
      - ${HOST_PROJECT_PATH}/backend:/app/backend
```

## Frontend

The frontend app, which uses Angular 18, is simple in terms of features: it allows listing, creating and editing users and products.

What are some technical aspects of Angular, Angular Material and RxJS that it demonstrates?

* [Built-in flow control](https://blog.angular.dev/introducing-angular-v17-4d7033312e4b), e.g., @if vs *ngIf. It's more readable and supposed to be more performant. New in Angular 17.
* [Angular Material 3](https://material.angular.io/guides) components.
* [Standalone components](https://angular.dev/guide/components/importing#standalone-components).
* [Dependency injection using `inject()`](https://angular.dev/tutorials/learn-angular/20-inject-based-di). (Introduced in Angular 14.)
* [Reactive forms](https://angular.dev/guide/forms/reactive-forms) and form validation.
* [Signal inputs](https://angular.dev/guide/signals/inputs). (In developer preview as of 2024-11-06.)
* [Observables](https://rxjs.dev/guide/overview).
* [Custom pipes](https://angular.dev/tutorials/learn-angular/24-create-a-pipe).
* An implementation of an Angular Material's [ErrorStateMatcher](https://material.angular.io/components/core/api#ErrorStateMatcher).
* [Injectable services](https://angular.dev/guide/di).
* [Routing](https://angular.dev/guide/routing).

Jasmine and Karma are used for testing.

## Backend

The backend app uses NodeJS and Express to provide a REST API for getting, creating, updating and deleting products and users in a Postgres database. It uses Joi for validation. I added some middleware for handling errors and logging.

The PostgreSQL database is created using the official PostgreSQL Docker image. Environment variables can be provided from `.env.local` following the example of `.env.example`.

Jest is used for testing.

## Shared

Both the frontend and backend apps use an NPM package `@onyxdevtutorials/interview-prep-shared` that defines TypeScript interfaces for `product` and `user`. The source code for the package is in `shared`.

## Workflow and Continuous Integration/Continuous Deployment (CI/CD)

`.gihub/workflows/ci.yml` is divided into two parts: `test` and `deploy`. `test` runs the frontend and backend tests when there are pushes to or pull requests on specified branches. Backend tests include integration tests that test API routes and endpoints using an ephemeral test database. Each integration test suite (`products.integration.test.ts` and `users.integration.test.ts`) runs migrations and seeds data. In order to avoid database conflicts the integration tests are run sequentially rather than in parallel.

The `deploy` part packages database migrations with a Lambda function and then invokes that function to set up the database, if that's necessary. It then builds and pushes Docker images for the frontend and backend to AWS ECR (Elastic Container Registry). Finally, it updates and deploys the frontend and backend ECS services.

The GitHub workflow accesses several "secrets," or values, stored in the GitHub repo for the project. I just entered the values manually via the GitHub UI: Settings -> Secrets and Variables -> Actions -> Repository Secrets. You'll see the variables/secrets referenced in ci.yml -- e.g., `secrets.AWS_ACCOUNT_ID`.

A lot of `ci.yml` is self-explanatory but here are some notes to help clarify some parts:

* **on**: Here we set the events and branches that trigger the workflow.
* **permissions**: This section defines the permissions granted to the GitHub Actions workflow. It includes:
  * **id-token: write**: This permission is required for requesting the JSON Web Token (JWT) used for authentication with AWS. It allows the workflow to assume an IAM role and access AWS resources securely.
  * **contents: read**: This permission is required for the `actions/checkout` action to read the repository contents. It allows the workflow to check out the code from the repository.
* **Package migration files**: Packages the database migration files by running a custom script (`./package-migrations.sh`) in the `./backend` directory. You can look at the file itself to see exactly what it does but here's an overview:
  * It copies the files in `backend/migrations` into `migrate-lambda/src/`.
  * Deletes any old `migrate-package.zip`.
  * Does an install and build for the Lambda function.
  * And finally zips up everything.
* **Update Lambda migration function**: Updates the AWS Lambda function code for database migrations using the AWS CLI. The workflow waits for the update to be completed before the function is invoked.
* **Build and push frontend Docker image**: Note that this step uses a Dockerfile in the root of the project, rather than the Dockerfile in the frontend directory. I wanted to keep the Dockerfile in the frontend directory for local development purposes, e.g., `frontend/Dockerfile` uses the Angular server and port 4200.

## Infrastructure

![Infrastructure Diagram](images/Interview-Prep-Infrastructure-v2.drawio.png)

The diagram above illustrates the major parts of the application infrastructure. Here are some descriptions and notes:

* **Interview Prep VPC**: "The Virtual Private Cloud (VPC) is a logically isolated network within the AWS cloud where we can launch and manage AWS resources. It provides a secure environment to group and connect related resources and services, such as EC2 instances, RDS databases, and ECS clusters. The VPC allows us to define our own IP address range, create subnets, and configure route tables and network gateways, ensuring that our infrastructure is both secure and scalable." (GitHub Copilot came up with such a great explanation here that I'm just going to use it as-is.)
* **Availability zones A and B**: `us-east-1a` and `us-east-1b`. These zones, along with their corresponding public and private subnets, enhance the app's resilience. Currently, one task each for the ECS frontend and backend is deployed, but this can be scaled to distribute tasks across both availability zones.
* **Public subnets A and B**: The load balancer, bastion host, NAT gateway and Internet gateway are in the public subnets. At the moment there isn't any real load balancing going on. 
* **Load balancer**: We're not doing any real load balancing at the moment as there's only one instance of the frontend and backend but we could easily scale up, e.g., by making the `desired_count` greater than 1 in the ECS module. Right now, the load balancer serves to connect the `dev.interviewprep.onyxdevtutorials.com` domain to the frontend ECS service, and the API gateway (`api.dev.interviewprep.onyxdevtutorials.com`) to the backend ECS service.
* **Bastion host**: This is an EC2 instance that isn't strictly necessary but provides a relatively secure way for SSH access to application services such as the database that are in the private subnet. I have a bastion security group that allows only SSH (port 22) access and only from my dedicated VPN IP address. With this I can, for example, SSH into the bastion and then run psql commands on the RDS-hosted Postgres database (see the `bastion_sg` security group and the `allow_bastion_to_db` rule in the Terraform security groups module).
* **Private subnets A and B**: The frontend and backend apps and ECS services, and the Postgres database, all run in the private subnets.
* **Security groups**: There are multiple security groups defining the ingress and egress for the various services, i.e., what can access what and via which ports. At present, we're using only http (port 80 for the frontend, port 3000 for the backend). Soon we'll make the whole thing https and add authorization for accessing the API.
* **Public route table**: The public routing table is associated with the public subnets and directs traffic to the internet through the Internet Gateway. This allows resources in the public subnets, such as the load balancer and bastion host, to communicate with the internet.
* **Private route table**: The private routing table is associated with the private subnets and directs traffic to the internet through the NAT Gateway. This allows resources in the private subnets, such as the ECS services and RDS database, to access the internet for updates and patches while keeping them isolated from direct internet access.
* **Internet gateway**: Allows resources within the VPC to communicate with the internet.
* **NAT gateway**: The NAT gateway is in public subnet A but both private subnets can use it via the private route table. We *could* add a NAT gateway to public subnet B to ensure higher availability and fault tolerance. The NAT gateway is used, for example, by ECS tasks to pull Docker images from the ECR. It's also used by the migrate Lambda function to get values from AWS Systems Manager Parameter Store.
* **API gateway**: This serves as a proxy that forwards the path, data, method, and other request details to the backend API server. This allows the backend to handle the actual processing of the requests. The API gateway is set up to handle CORS, limiting web browser requests to pages served from our frontend host. In the future we'll add an API key and authorization to restrict usage of the API.
* **ECR for hosting frontend and backend Docker images**: Our GitHub workflow builds and pushes Docker images of our frontend and backend apps to the AWS Elastic Container Registry, tagging the latest build as... "latest."
* **ECS cluster with frontend and backend ECS services**: The GitHub workflow updates the backend and frontend services in the AWS Elastic Container Service. These services are where our frontend and backend servers actually run, providing the necessary environments for our applications to operate.
* **RDS-hosted Postgres database instance**: The application uses an instance of Postgres hosted by the AWS Relational Database Service. It runs in the private subnets.
* **Migrate Lambda function**: This is a function run by the GitHub workflow. A workflow step packages up the migration files with the Lambda function itself and then invokes the function.
* **Route 53-hosted domains**: `dev.interviewprep.onyxdevtutorials.com` and `api.dev.interviewprep.onyxdevtutorials.com`. The DNS configuration in Route 53 connects the frontend and backend domains to the load balancer. This is achieved using alias records that point to the load balancer's DNS name and zone ID.
* **CIDR Blocks**: CIDR (Classless Inter-Domain Routing) blocks are used to define IP address ranges within the VPC.
  * **VPC CIDR Block**: This is set to `10.0.0.0/16`, allowing for 65,536 possible IP addresses -- which is plenty for this project.
  * **Subnet CIDR Blocks**: Each subnet gets 256 IP addresses:
    * **Public Subnet A**: 10.0.1.0/24 provides 256 IP addresses.
    * **Public Subnet B**: 10.0.2.0/24 provides 256 IP addresses.
    * **Private Subnet A**: 10.0.3.0/24 provides 256 IP addresses.
    * **Private Subnet B**: 10.0.4.0/24 provides 256 IP addresses.

## Costs

In this infrastructure the costliest thing is the bastion ec2 instance. Given that it's usually not needed, it can be stopped and started as necessary. When I carelessly left it running for a month the cost was about 80 USD. In terms of security, it's of course better to run the bastion server only when needed. 

The VPC is about 20 USD/month. ECS, ALB and RDS are about $15 USD/month each. 

Bear in mind that this is totally a demo-type project. It has no real traffic, users, etc., and it has minimal assets.

## About Terraform and the Organization Used Here

Terraform is an open-source infrastructure as code (IaC) tool that allows you to define and provision infrastructure using a high-level configuration language. It enables you to manage your infrastructure in a declarative manner, ensuring consistency and repeatability.

In this project, Terraform is used to manage the AWS infrastructure. The setup is organized using environments and modules to promote reusability and maintainability:

* **Environments**: Different environments (e.g., development, staging, production) are defined to isolate resources and configurations. Each environment has its own set of variables and state files, allowing for independent management and deployment.
* **Modules**: Terraform modules are used to encapsulate and reuse configurations for specific resources or groups of resources. For example, there are modules for VPC, ECS, RDS, and other components. This modular approach helps to keep the configuration organized and makes it easier to manage and update individual parts of the infrastructure.

The main Terraform configuration file (`main.tf`) references these modules and passes the necessary variables to them. This structure allows for a clear separation of concerns and simplifies the management of complex infrastructure setups.

### Terraform Configuration Files

In addition to the main configuration file (`main.tf`), this project uses `outputs.tf` and `variables.tf` files to manage Terraform outputs and variables:

* **variables.tf**: This file defines the input variables for the Terraform configuration. Variables allow you to parameterize your Terraform modules and configurations, making them more flexible and reusable. Each variable can have a default value, a description, and a type. For example, you might define variables for the AWS region, environment name, or instance types.

* **outputs.tf**: This file defines the outputs of the Terraform configuration. Outputs are used to expose information about your infrastructure after it has been provisioned. For example, you might output the DNS name of a load balancer, the ID of a VPC, or the endpoint of a database. Outputs can be used to pass information between different Terraform configurations or to provide information to other tools and scripts.

* **terraform.tfvars**: This file is used to set the values for the input variables defined in `variables.tf`. It allows you to specify the actual values for the variables, making it easier to manage different configurations for different environments. For example, you might have different `terraform.tfvars` files for development, staging, and production environments, each with its own set of variable values.

These files help to organize and manage the configuration, making it easier to understand and maintain.

### Useful Terraform Commands

Here are some of the main Terraform commands that are useful for managing infrastructure and dealing with problems:

* **terraform init**: Initializes a Terraform configuration. This command sets up the backend and installs any required providers and modules.
* **terraform plan**: Creates an execution plan, showing what actions Terraform will take to achieve the desired state defined in the configuration files.
* **terraform apply**: Applies the changes required to reach the desired state of the configuration. This command executes the actions proposed in the plan.
* **terraform destroy**: Destroys the infrastructure managed by Terraform. This command is used to clean up resources.
* **terraform taint**: Marks a resource for recreation. This command is useful when you want to force a resource to be destroyed and recreated during the next apply.
* **terraform import**: Imports existing infrastructure into your Terraform state. This command is useful for bringing resources that were created outside of Terraform under its management.
* **terraform state**: Manages the state file. This command can be used to list resources, move resources, and remove resources from the state file.
* **terraform refresh**: Updates the state file with the real-world state of resources. This command is useful for ensuring that the state file is up-to-date.
* **terraform output**: Displays the outputs defined in the configuration. This command is useful for retrieving information about your infrastructure.
* **terraform validate**: Validates the configuration files. This command checks for syntax errors and other issues.
* **terraform fmt**: Formats the configuration files to a canonical format. This command is useful for ensuring consistency in the codebase.

## Building the App and Running It Locally

Prerequisites:

* [Docker desktop app](https://www.docker.com/) installed and running.
* [VSCode](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

1. Command-P and choose Dev Containers: Clone Repository in Container Volume...
1. Specify this repo and choose the Development branch.
1. `export NODE_ENV=local`
1. `cd` to the root of this project.
1. Create `.env.local` and `.env.test` files based on `.env.example` and customize the values as necessary.
1. Open a terminal and run `docker-compose --env-file .env.local build`.

### Run the App Locally

1. `docker-compose --env-file .env.local up frontend` (The dependent services should come up automatically.)
1. Load `http://localhost:4200/` in a web browser. You should be able to add new users and products, edit them, and list them.

### Running Tests

#### Backend

To run backend tests:

1. `docker-compose -f docker-compose.test.yml --env-file .env.test build backend-tests`
1. `docker-compose -f docker-compose.test.yml --env-file .env.test up backend-tests`

To view test and coverage reports in a web browser:

1. Bring up test db with `docker-compose --env-file .env.test -f docker-compose.test.yml up db-test`
1. In a separate terminal window, `cd` into `backend`.
1. `export DATABASE_URL=postgres://postgres:postgres@db-test:5432/testdb`.
1. `npm run test:coverage`. That will run all the tests and a coverage report.
1. `npm run serve:report`. This will bring up a pretty web page at `http://localhost:8080/` where you should be able to look at test and coverage reports.

#### Note

I thought it would be nice to have a *live* web display of test results and coverage but that's problematic. Practically speaking it's probably best or easiest just to run `npm run test:watch` as you make code changes; that will present the familiar terminal based interface to give you feedback on particular code you change and tests you write. 

### Frontend

To run frontend tests:

1. `docker-compose --env-file .env.test -f docker-compose.test.yml build frontend-tests`
1. `docker-compose --env-file .env.test -f docker-compose.test.yml up frontend-tests`

Tests can also be run in watch mode so that they will be re-run as you make changes to code and tests:

1. `docker-compose --env-file .env.local up frontend`
1. `cd frontend`
1. `npm run test:watch`

## Bastion Host

A bastion host is a server used to provide some limited, secure access to assets and services in a private subnet. I've configured this bastion host for this project so that it allows only SSH access (via port 22) and only from the dedicated IP address of my private VPN. For reasons of security and cost, it's best to leave the bastion ec2 instance in a stopped state except when you need it.

Practically speaking, I used the bastion host mainly to access the Postgres database during development. That is, the security group for the database allows access from the bastion host, so by SSHing into the bastion I could run `psql` commands to check on the database and its tables to verify that things were as I expected.

To SSH into the bastion host:

`ssh -i /path/to/your/private-key.pem ec2-user@<bastion-public-ip-address>`

To SSH into the bastion host with agent forwarding so that you can use local SSH keys to connect to other machines or hosts:

`ssh -A -i /path/to/your/private-key.pem ec2-user@<bastion-public-ip-address>`

Once you're connected to the bastion host, you can directly access the database:

`psql -h <db-endpoint> -U <username> -d <db-name>`

Once connected to the database, you can type `\l` to list all the databases managed by the PostgreSQL server you are connected to.

Type `\dt` to list all the tables in the current database.

Type `\d products` or `\d users` to get information about each of these tables.

## Add New Migration File

Assuming CWD is `backend`, `npx knex migrate:make <migration-file-name> --knexfile ./src/knexFile.ts --migrations-directory ../migrations`.

## Version History

### 0.1.0
- Added Terraform configuration for managing AWS infrastructure.
- Set up AWS resources including VPC, subnets, security groups, RDS, ECS, ECR, bastion host, SSM parameters, Lambda functions, load balancer, Route 53 DNS, and API Gateway.
- Updated GitHub workflow to deploy infrastructure and application.

### 0.0.0
- Created a frontend app with views for adding and updating users and products, with services to talk to the REST API of the backend.
- Created a backend app to persist users and products in a PostgreSQL database and provide a REST API for the frontend.
- Created unit and integration tests for frontend and backend.
- Dockerized the application and set it up to use a devcontainer.
- Created a GitHub workflow to run tests when there push to or pull request on development, stage or production branches.
