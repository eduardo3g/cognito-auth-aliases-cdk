# Cognito Setup with the AWS CDK (Cloud Development Kit)

This is a boilerplate to set up an AWS Cognito User Pool.

It is configured to authenticate users by email address (username) or a preferred username - in my case, I used the brazilian CPF (aka. Individual Taxpayer Registration). Note that the preferred username could be anything you wanted, as long as it is unique whithin the user pool.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Deploying the application

First of all, you need to bootstrap you AWS account to use the AWS CDK by running the following command:

```
cdk bootstrap
```

Now you're all set, run the `deploy` command and capture the User Pool and Client IDs in the output file:

```
cdk deploy --outputs-file ./cdk-outputs.json
```

After the deployment is completed, you should see a a content similar to this in the `cdk-outputs.json` file:

```
{
  "AuthStack": {
    "stepsUserPoolClientId": "0982h9e0alk7dtutctm1ajas",
    "stepsUserPoolId": "us-east-1_7jhfl1l9a"
  }
}
```

Both IDs will be used to interact with the AWS User Pool.

## Testing the application

To keep it simple, we'll use the AWS CLI to interact with Cognito, but the same could be done from your application using either the AWS SDK Cognito Client or AWS Amplify library.

Here's a list of features we want to test against our User Pool:

* Create a new user
* Update client attributes
* Update client `custom` attributes (e.g. tenantId and createdAt)
* Update the user password (required to remove the `Force change password` account status)
* Authenticate using the email address (aka. username)
* Authenticate using the preferred username, that in this case, is the Brazilian CPF (aka. Individual Taxpayer Registration)

Open your terminal and let's begin! Run each command updating the user information and parameters (Cognito User Pool ID and Client ID).

### Create a new user
```
aws cognito-idp admin-create-user \
  --user-pool-id <cognito-user-pool-id> \
  --username your-address@mail.com \
  --user-attributes Name="given_name",Value="John" \
     Name="family_name",Value="Smith" \
     Name="preferred_username",Value="98730457861" \
     Name="email",Value="your-address@mail.com"
```

### Update client attributes

Cognito has a huge list of client attributes, so let's update just two of them: `name` and `gender`.

```
aws cognito-idp admin-update-user-attributes \
  --user-pool-id <cognito-user-pool-id> \
  --username your-address@mail.com \
  --user-attributes Name="gender",Value="m" Name="name",Value="John Doe Smith"
```

### Update custom client attributes

```
aws cognito-idp admin-update-user-attributes \
  --user-pool-id <cognito-user-pool-id> \
  --username your-address@mail.com \
  --user-attributes Name="custom:tenantId",Value="198704312389756" \
     Name="custom:createdAt",Value="2023-06-24"
```

### Update the user password

In this example I want the user password to be the same value as the user Brazilian CPF (Individual Taxpayer Registration). This document has 11 digits and the User Pool password policy requires at least `11 digits`, so keep that in mind when you set up the password.

```
aws cognito-idp admin-set-user-password \
  --user-pool-id <cognito-user-pool-id> \
  --username 98730457861 \
  --password 98730457861 \
  --permanent
```

### Authenticate using the email address

We're now finally able to authenticate. Let's use the email address as our first option. Be careful, this method requires both the `Client ID` and `User Pool ID` to authenticate.

```
aws cognito-idp admin-initiate-auth \
    --client-id <cognito-app-client-id> \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --region us-east-1 \
    --auth-parameters 'USERNAME=your-address@mail.com,PASSWORD=98730457861' \
    --user-pool-id <cognito-user-pool-id>
```

Voilà! You should see the AccessToken in your terminal session.

### Authenticate using the preferred username (aka. Brazilian CPF)

Let's run the final test and see if Cognito also recognizes you by your preferred username.

```
aws cognito-idp admin-initiate-auth \
    --client-id <cognito-app-client-id> \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --region us-east-1 \
    --auth-parameters 'USERNAME=98730457861,PASSWORD=98730457861' \
    --user-pool-id <cognito-user-pool-id>
```

It should work as expected and return the same response from the email authenticate (the AccessTokens generated are different, of course, but they belong exclusively to you).

## Destroying the resources

In case you want to remove the deployed resources from AWS, just run the following command

```
cdk destroy
```