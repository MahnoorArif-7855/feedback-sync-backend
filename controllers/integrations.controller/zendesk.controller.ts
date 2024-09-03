import axios, { AxiosRequestConfig } from 'axios';
import { RequestHandler } from 'express';
import { Feedback } from '../../database';
import config from '../../config';

const algoliasearch = require('algoliasearch');

const get: RequestHandler = async (req: any, res, next) => {
  try {
    const feedbackGPTAPI = config.FEEDBACK_GPT_WEAVIATE_API;

    console.log('feedbackGPTAPI', feedbackGPTAPI);

    const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
    const index = algoliaClient.initIndex(process.env.ALGOLIA_INDEX_NAME);
    const data = req.body;
    const authvalidation = req.user;
    const { zendeskSubDomain, authToken, userId, organizationId, from, to } = data;

    const apiUrl = `https://${zendeskSubDomain}.zendesk.com/api/v2/search?query=type:ticket created>=${from} created<=${to}`;

    if (authvalidation) {
      const config: AxiosRequestConfig = {
        method: 'GET',
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authToken}`,
        },
        params: {
          archive_immediately: false,
        },
      };

      const getTicket = () => {
        const promises: any[] = [];
        axios(config)
          .then(async (response: any) => {
            const pgNumber = Math.ceil(response.data.count / 100);

            for (let i = 1; i < pgNumber + 1; i++) {
              console.log(`Getting page ${i} of ${pgNumber}`);
              await getPage(i);
            }
            console.log('All pages retrieved, ready to post to feedbackGPTAPI');
            if (feedbackGPTAPI) {
              axios
                .post(
                  `${feedbackGPTAPI}/insert_data`,
                  {
                    organization_id: organizationId,
                    source: 'zendesk',
                    batch_processing: true,
                  },
                  {
                    headers: {
                      'Content-type': 'application/json',
                    },
                  }
                )
                .then((response: any) => {
                  console.log('END processFromZendesk WEAVIATE Feedback API: processFrom Zendesk');
                })
                .catch((error: any) => {
                  console.error('Error sending message:', error);
                });
            }
            res.status(200).json({ responseData: response.data.results, insertedCount: 0 });
          })
          .catch((error: any) => {
            if (res.status(401)) {
              console.log('res', error);
              res.status(401).json(error.response?.data);
            } else if (res.status(404)) {
              res.status(404).json(error.response.data);
            }
          });
      };

      await getTicket();

      const getPage = (pg: any) => {
        return new Promise((resolve, reject) => {
          const options = {
            method: 'GET',
            url: `https://${zendeskSubDomain}.zendesk.com/api/v2/search.json?page=${pg}&query=type:ticket created>=${from} created<=${to}`,
            headers: {
              authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
            params: {
              archive_immediately: false,
            },
          };

          axios(options)
            .then(async (response) => {
              const responseData = response.data.results;
              const existingItems = await Feedback.find({
                'sourceData.zendesk.url': {
                  $in: responseData.map((item: any) => item.url),
                },
              });

              const newItems = responseData.filter(
                (item: any) => !existingItems.some((existingItem) => existingItem.sourceData.zendesk?.url === item.url)
              );

              const updateExistingItems = responseData.filter((item: any) =>
                existingItems.some((existingItem) => existingItem.sourceData.zendesk?.url === item.url)
              );

              if (responseData.length === 0) {
                res.status(200).json({ responseData, insertedCount: 0 });
                return { responseData, insertedCount: 0 };
              }

              updateExistingItems.forEach(async (element: any) => {
                const ticketId = element.id; // resp?.sourceData?.zendesk?.id;
                // const feedbackObjectId = resp?._id?.toString();

                console.log('ticketId --->>> ', ticketId);

                const commentsOptions = {
                  method: 'GET',
                  url: `https://${zendeskSubDomain}.zendesk.com/api/v2/tickets/${ticketId}/comments`,
                  headers: {
                    authorization: `Basic ${authToken}`,
                    'Content-Type': 'application/json',
                  },
                  params: {
                    archive_immediately: false,
                  },
                };

                const zendekCom = await axios(commentsOptions);

                const com = zendekCom.data.comments.map((zen: any) => {
                  return zen.plain_body;
                });

                const feedbackComment = com.join('\n\n');

                const zendeskExitingInfo = {
                  feedback: element.description,
                  date: element.created_at,
                  userId: userId,
                  zendeskTags: element.tags,
                  organizationId: organizationId,
                  category: 'others',
                  interestedUsers: [],
                  interestedChannels: { channelName: null, channelID: null },
                  source: 'zendesk',
                  sourceData: { zendesk: element },
                  zendeskComment: feedbackComment,
                };

                await Feedback.findOneAndUpdate(
                  {
                    'sourceData.zendesk.url': element?.url,
                  },
                  { $set: zendeskExitingInfo },
                  { new: true }
                )
                  .then(async (res) => {
                    const algoliaExistingObj = {
                      ...zendeskExitingInfo,
                      objectID: res?._id?.toString(),
                    };

                    await index.partialUpdateObject(algoliaExistingObj, {
                      createIfNotExists: true,
                    });
                    // resolve(res);
                  })
                  .catch((err) => {
                    console.log('Error inserting Feedback', err);
                    // reject(err);
                  });
              });

              const feedbackDocuments: any[] = [];
              newItems.forEach((element: any) => {
                const zendeskInfo = {
                  feedback: element.description,
                  date: element.created_at,
                  ticketId: element.id,
                  userId: userId,
                  zendeskTags: element.tags,
                  organizationId: organizationId,
                  category: 'others',
                  interestedUsers: [],
                  interestedChannels: { channelName: null, channelID: null },
                  source: 'zendesk',
                  sourceData: { zendesk: element },
                };
                feedbackDocuments.push(zendeskInfo);
              });

              feedbackDocuments &&
                feedbackDocuments.length > 0 &&
                (await Feedback.insertMany(feedbackDocuments)
                  .then(async (ticketData: any) => {
                    feedbackDocuments?.forEach(async (doc, i) => {
                      const commentsInsertOptions = {
                        method: 'GET',
                        url: `https://${zendeskSubDomain}.zendesk.com/api/v2/tickets/${doc.ticketId}/comments`,
                        headers: {
                          authorization: `Basic ${authToken}`,
                          'Content-Type': 'application/json',
                        },
                        params: {
                          archive_immediately: false,
                        },
                      };

                      const zendekInsertCom = await axios(commentsInsertOptions);

                      const com = zendekInsertCom.data.comments.map((zen: any) => {
                        return zen.plain_body;
                      });

                      const feedbackInsertComment = com.join('\n\n');

                      await Feedback.findOneAndUpdate(
                        {
                          'sourceData.zendesk.url': doc.sourceData.zendesk.url,
                        },
                        { $set: { zendeskComment: feedbackInsertComment } },
                        { new: true }
                      );

                      // const algoliaDocs = insertedDocs?.map((doc) => {

                      const algoliaObj = {
                        objectID: ticketData[i]._id.toString(),
                        feedback: doc.feedback,
                        date: doc.date,
                        organization: doc.organization,
                        userId: doc.userId,
                        ticketId: doc.ticketId,
                        source: doc.source,
                        organizationId: doc.organizationId,
                        zendeskTags: doc.zendeskTags,
                        interestedUsers: doc.interestedUsers,
                        interestedChannels: doc.interestedChannels,
                        category: 'others',
                      };

                      index
                        .saveObject(algoliaObj)
                        .then((res: any) => {
                          console.log('data added in algolia successfully', res);
                        })
                        .catch((error: any) => {
                          console.log('algloia error');
                          console.log(error);
                        });
                    });
                    resolve(ticketData);
                    res.status(200).json(JSON.stringify(ticketData));
                  })
                  .catch((error: any) => {
                    reject(error);
                    console.log('Error while inserting in zendesk documents', error);
                  }));
              resolve('success');
            })
            .catch((error: any) => {
              console.log('Error while calling in zendesk api', error);

              if (res.status(401)) {
                res.status(401).json(error.response?.data);
              } else if (res.status(404)) {
                res.status(404).json(error.response.data);
              }
              reject('error');
            });
        });
      };
    }
  } catch (error) {
    console.error(`Error running zendesk query: ${error}`);
    next(error);
  }
};

export default {
  get,
};
