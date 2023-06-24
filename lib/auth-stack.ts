import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { UserPool } from "aws-cdk-lib/aws-cognito";

export class AuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * UserPool
     */
    const userPool: UserPool = new cognito.UserPool(this, "StepsUserPool", {
      userPoolName: 'steps-user-pool',
      selfSignUpEnabled: true,
      signInAliases: {
        username: true, // email
        preferredUsername: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
        email: {
          required: true,
          mutable: true,
        }
      },
      customAttributes: {
        'tenantId': new cognito.StringAttribute({
          mutable: true,
          minLen: 10,
          maxLen: 15,
        }),
        'createdAt': new cognito.DateTimeAttribute({
          mutable: true
        }),
      },
      // userVerification: {
      //   emailSubject: 'Você precisa verificar sua conta',
      //   emailBody: 'Your account was created successfully and your verification code is {####}',
      //   emailStyle: cognito.VerificationEmailStyle.CODE,
      // },
      passwordPolicy: {
        minLength: 11,
        requireLowercase: false,
        requireUppercase: false,
        requireSymbols: false,
        requireDigits: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /**
     * UserPool Client Attributes
     */
    const standardCognitoAttributes = {
      givenName: true,
      familyName: true,
      email: true,
      emailVerified: true,
      address: true,
      birthdate: true,
      gender: true,
      locale: true,
      middleName: true,
      fullname: true,
      nickname: true,
      phoneNumber: true,
      phoneNumberVerified: true,
      profilePicture: true,
      preferredUsername: true,
      profilePage: true,
      timezone: true,
      lastUpdateTime: true,
      website: true,
    };

    const clientReadAttributes = new cognito.ClientAttributes()
      .withStandardAttributes(standardCognitoAttributes)
      .withCustomAttributes(...['tenantId', 'createdAt']);

    const clientWriteAttributes = new cognito.ClientAttributes()
      .withStandardAttributes({
        ...standardCognitoAttributes,
        emailVerified: false,
        phoneNumberVerified: false,
      })
      .withCustomAttributes(...['tenantId', 'createdAt']);

    /**
     * UserPool App Client
     */
    const userPoolClient = new cognito.UserPoolClient(this, 'userpool-client', {
      userPool,
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
      ],
      readAttributes: clientReadAttributes,
      writeAttributes: clientWriteAttributes,
    });

    /**
     * Outputs
     */
    new cdk.CfnOutput(this, 'stepsUserPoolId', {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, 'stepsUserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
  }
}
