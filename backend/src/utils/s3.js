const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

async function getPresignedUrl(filename, filetype) {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    const error = new Error('AWS_S3_BUCKET is not configured');
    error.code = 'S3_NOT_CONFIGURED';
    throw error;
  }

  const params = {
    Bucket: bucket,
    Key: `uploads/${Date.now()}-${filename}`,
    Expires: 60,
    ContentType: filetype,
  };

  const url = await s3.getSignedUrlPromise('putObject', params);
  return {
    url,
    bucket,
    key: params.Key,
  };
}

module.exports = {
  getPresignedUrl,
};
