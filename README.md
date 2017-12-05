# AWS Lambda function example using the DataStax Node.js driver

An AWS Lambda function that uses the [DataStax Node.js driver][nodejs-driver] to insert a group of metrics coming from
a device.

This sample project is part of a blog post on [DataStax Academy Developer Blog][dev-blog].

## How to Deploy

Install the dependencies locally.

```bash
npm install
```

Create a zip package containing the `index.js` file and the `node_modules` directory.

```bash
zip -r dse-function-sample.zip index.js node_modules
```

[Upload the deployment package to AWS][lambda-upload].

## Schema

The schema is designed to contain a few raw data points in a list per row, while using separate columns for the min 
and max values.

```sql
CREATE TABLE temperature (
  device_id text,
  bucket_id text, 
  date timestamp,
  min_value float,
  max_value float,
  values frozen<list<float>>,
  PRIMARY KEY ((device_id, bucket_id), date)
)
```

The intention is to support SELECT queries to output the min and the max within a certain period, or flatten all the 
raw values within short period of times.

```sql
-- Max and min within a range of dates
SELECT max_value, min_value FROM temperature
WHERE device_id = 'id1' AND bucket_id = 'bucket1' AND date >= '2017-12-31' AND date < '2018-01-01';

-- All raw data points within a range of dates
SELECT values FROM temperature
WHERE device_id = 'id1' AND bucket_id = 'bucket1' AND date >= '2017-12-31' AND date < '2018-01-01';

-- Aggregate max and min within a range of dates
SELECT MAX(max_value) AS agg_max, MIN(min_value) AS agg_min FROM temperature
WHERE device_id = 'id1' AND bucket_id = 'bucket1' AND date >= '2017-12-31' AND date < '2018-01-01';
```

[nodejs-driver]: https://github.com/datastax/nodejs-driver 
[dev-blog]: https://academy.datastax.com/developer-blog
[lambda-upload]: http://docs.aws.amazon.com/lambda/latest/dg/vpc-rds-upload-deployment-pkg.html