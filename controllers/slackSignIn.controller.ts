import axios, { AxiosRequestConfig } from 'axios';
import { RequestHandler } from 'express';
import { Feedback, Organization, User } from '../database';
import { WebClient } from '@slack/web-api';
import * as admin from 'firebase-admin';
import config from '../config';

const get: RequestHandler = async (req, res, next) => {
  interface UserInfo {
    id?: string;
    team_id?: string;
    name?: string;
  }
  interface UserProfileInfo {
    email?: string | undefined;
  }
  try {
    const accessToken = req.query.accessToken as string;
    const data = req.body;

    const web = new WebClient(accessToken);

    const responses = await web.openid.connect.userInfo();
    const userId = responses.sub || responses['https://slack.com/user_id'];
    const teamId = responses['https://slack.com/team_id'];
    const teamName = responses['https://slack.com/team_name'];
    const name = responses.name;

    try {
      const { email }: UserProfileInfo = responses ?? {
        email: '',
      };
      try {
        const organizationInDB: any[] = await Organization.find({
          organizationId: teamId,
        });

        const { access_token, token_type, refresh_token } = data;

        const organizationDoc = {
          _id: teamId,
          organizationName: teamName,
          organizationId: teamId,
          tokenType: token_type,
          status: 'active',
          plan: 'free',
          appInstallation: false,
          appStatus: 'not Install yet',
          searchCount: 0,
          newOrgBilling: true,
          appId: process.env.SLACK_APP_ID,
          bot: {
            scopes: [
              'channels:history',
              'channels:read',
              'chat:write',
              'commands',
              'groups:history',
              'groups:read',
              'im:history',
              'im:read',
              'mpim:history',
              'users:read',
              'users:read.email',
            ],
            token: access_token,
            refresh_token: refresh_token,
            userId: userId,
            authVersion: 'v2',
          },
          authVersion: 'v2',
        };

        const createTokens = async () => {
          const uid = userId as string;

          await admin
            .auth()
            .createCustomToken(uid)
            .then(async (customToken: any) => {
              await User.findOneAndUpdate(
                {
                  userId: userId,
                },
                { firebaseLogin: true },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
              res.status(200).json(customToken);
            })
            .catch((error) => {
              console.log('error', error);
            });
        };

        const userInDB: any[] = await User.find({
          userId: userId,
          organizationId: teamId,
        });

        if (userInDB.length === 0) {
          await User.create({
            userId: userId,
            userName: name,
            email: email,
            organizationId: teamId,
            type: 'user',
            step: 1,
          })
            .then(async () => {
              // Find conversation with a specified channel `name`
              // await findConversation('general');
              await createTokens();
            })
            .catch((error: any) => {
              console.log('error------', error);
            });
        } else {
          await createTokens();
        }

        if (organizationInDB.length === 0) {
          await Organization.create(organizationDoc);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
      }
    } catch (error: any) {
      console.log('error while create token', error);
    }
  } catch (error) {
    console.error(`Error running slacksignin query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
