'use strict';

const dse = require('dse-driver');
const contactPoints = process.env['CONTACT_POINTS'];
const keyspace = 'ks1';
if (!contactPoints) throw new Error('Environment variable CONTACT_POINTS not set');

const client = new dse.Client({
  contactPoints: contactPoints.split(','),
  keyspace,
  // Disable automatic metadata synchronization and pool warmup to cut down initialization time
  isMetadataSyncEnabled: false,
  pooling: { warmup: false }
});

const query = 'INSERT INTO temperature (device_id, bucket_id, date, min_value, max_value, values) ' +
              'VALUES (?, ?, ?, ?, ?, ?)';

console.log('Initializing AWS Lambda Function');

// Start connecting to the cluster
client.connect()
  .then(() => client.metadata.refreshKeyspace(keyspace))
  .then(() => console.log('Connected to the DSE cluster, discovered %d nodes', client.hosts.length))
  .catch(err => console.error('There was an error trying to connect', err));

/**
 * Lambda function entry point.
 */
exports.handler = (event, context, callback) => {
  // Connections are pooled during the lifetime of the Lambda function instance
  context.callbackWaitsForEmptyEventLoop = false;

  // Its usually a good idea to validate the parameters :)
  const params = [ event.device, event.bucket, new Date(event.date), event.minValue, event.maxValue, event.values ];

  client.execute(query, params, { prepare: true })
    .then(() => callback())
    .catch(err => {
      console.error("There was an error executing ", err);
      callback(err);
    });
};