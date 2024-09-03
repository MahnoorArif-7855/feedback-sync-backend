import { RequestHandler } from 'express';
import { Feedback } from '../database';
import config from '../config';
import axios from 'axios';
import { convertToMongoDBDate } from '../utils/func';
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const path = require('path');
const csv = require('csvtojson');
const algoliasearch = require('algoliasearch');

// const parser = csv.parse({ columns: true });
const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;

const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);

const get: RequestHandler = async (req: any, res, next) => {
  const index = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME);
  try {
    upload.single('file')(req, res, async (error: any) => {
      if (error) {
        console.error('Upload failed:', error);
        res.status(500).send('Upload failed');
      } else {
        const { file } = req;
        const { organizationId, userId } = req.query;
        console.log('[Upload CSV File]', req.query);

        const filePath = path.join(file.destination, file.filename);

        csv()
          .fromFile(filePath)
          .then(function (jsonArrayObj: any) {
            const filteredData = jsonArrayObj.filter(
              (row: any) => row['Submit Date'] && row['Category'] && row['Description']
            );

            const jsonArray = (filteredData.length > 0 && filteredData) || jsonArrayObj;

            jsonArray.map((data: any) => {
              const feedbacksValue = Object.values(data);
              const dateString = data['Submit Date'] || null;
              const mongoDBDate = dateString && convertToMongoDBDate(dateString);

              const feedbackText = data['Description'] || feedbacksValue[0];
              const feedbackDate: any = mongoDBDate || new Date();
              const feedbackTags: any = data['Category'] || '';
              const feedbackInfo = {
                feedback: feedbackText,
                category: 'others',
                userId,
                date: feedbackDate,
                organizationId: organizationId,
                interestedUsers: [],
                interestedChannels: { channelName: null, channelID: null },
                source: 'csv',
                tags: [feedbackTags],
                sourceData: {
                  csv: {
                    feedback: feedbackText,
                    date: feedbackDate,
                    category: 'others',
                    organizationId: organizationId,
                    interestedChannels: {
                      channelID: null,
                      channelName: null,
                    },
                    tags: [feedbackTags],
                  },
                },
              };

              Feedback.create(feedbackInfo).then((reponseData) => {
                const algoliaObj = {
                  objectID: reponseData._id.toString(),
                  feedback: feedbackText,
                  date: reponseData?.date,
                  organization: '',
                  userId: userId,
                  source: 'csv',
                  organizationId: organizationId,
                };

                index
                  .saveObject(algoliaObj)
                  .then((res: any) => {
                    console.log('data added in algolia successfully', reponseData._id.toString());
                  })
                  .catch((error: any) => {
                    console.log('algloia error');
                    console.log(error);
                  });

                console.log('File uploaded and processed successfully.');
              });
            });
          });

        feedbackGPTAPI &&
          axios
            .post(
              `${feedbackGPTAPI}/insert_data`,
              {
                organization_id: organizationId,
                source: 'csv',
                batched_processing: true,
              },
              {
                headers: {
                  'Content-type': 'application/json',
                },
              }
            )
            .then((response: any) => {
              console.log('[WEAVIATE API]: SUCCESS insert_data for csv', response.data);
            })
            .catch((error: any) => {
              console.error('Error sending message:', error);
            });

        res.status(200).send('File uploaded and processed successfully.');
      }
    });
  } catch (error) {
    console.error(`Error running userDetails query: ${error}`);
    next(error);
    res.status(300).send('Error');
  }
};

export default {
  get,
};
